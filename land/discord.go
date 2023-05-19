package land

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/alioygur/gores"
	"github.com/b1naryth1ef/shandi/land/db"
	goalone "github.com/bwmarrin/go-alone"
	"github.com/gorilla/sessions"
	"github.com/spf13/viper"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

const (
	authURL      string = "https://discordapp.com/api/oauth2/authorize"
	tokenURL     string = "https://discordapp.com/api/oauth2/token"
	userEndpoint string = "https://discordapp.com/api/v7/users/@me"
)

var signer *goalone.Sword
var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randSeq(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

var cachedConfig *oauth2.Config

var (
	sessionStore *sessions.CookieStore
)

func getSession(w http.ResponseWriter, r *http.Request) *sessions.Session {
	session, err := sessionStore.Get(r, "session")
	if err != nil {
		log.Printf("%v", err)
		http.Error(w, "Invalid or corrupted session", http.StatusInternalServerError)
		return nil
	}
	return session
}

type DiscordUser struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	Discriminator string `json:"discriminator"`
	Avatar        string `json:"string"`
	Email         string `json:"email"`
	Verified      bool   `json:"verified"`
}

func initializeDiscordAuth() {
	signer = goalone.New([]byte(viper.GetString("secret")))
	sessionStore = sessions.NewCookieStore([]byte(viper.GetString("secret")))

	cachedConfig = &oauth2.Config{
		ClientID:     viper.GetString("discord.client_id"),
		ClientSecret: viper.GetString("discord.client_secret"),
		RedirectURL:  viper.GetString("discord.redirect_uri"),
		Endpoint: oauth2.Endpoint{
			AuthURL:  authURL,
			TokenURL: tokenURL,
		},
		Scopes: []string{"identify"},
	}

}

func (h *HTTPServer) routeGetLoginDiscordRoute(w http.ResponseWriter, r *http.Request) {
	session := getSession(w, r)
	if session == nil {
		log.Printf("no session")
		return
	}

	err := r.ParseForm()
	if err != nil {
		gores.Error(w, http.StatusBadRequest, "Bad Form Data")
		return
	}

	session.Values["state"] = randSeq(32)
	session.Save(r, w)

	url := cachedConfig.AuthCodeURL(session.Values["state"].(string), oauth2.AccessTypeOnline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *HTTPServer) routeGetLoginDiscordCallbackRoute(w http.ResponseWriter, r *http.Request) {
	session := getSession(w, r)
	if session == nil {
		return
	}

	state := r.FormValue("state")
	if state != session.Values["state"] {
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	errorMessage := r.FormValue("error")
	if errorMessage != "" {
		gores.Error(w, http.StatusBadRequest, fmt.Sprintf("Error: %v", errorMessage))
		return
	}

	token, err := cachedConfig.Exchange(oauth2.NoContext, r.FormValue("code"))
	if err != nil {
		gores.Error(w, 500, fmt.Sprintf("Error: %v", err))
		return
	}

	req, err := http.NewRequest("GET", userEndpoint, nil)
	if err != nil {
		gores.Error(w, 500, fmt.Sprintf("Error: %v", err))
		return
	}

	req.Header.Set("Authorization", token.Type()+" "+token.AccessToken)
	client := &http.Client{Timeout: 10 * time.Second}

	res, err := client.Do(req)
	if err != nil {
		gores.Error(w, 500, fmt.Sprintf("Error: %v", err))
		return
	}

	var discordUser DiscordUser
	err = json.NewDecoder(res.Body).Decode(&discordUser)
	if err != nil {
		gores.Error(w, 500, fmt.Sprintf("Error: %v", err))
		return
	}

	user, err := db.GetUserByID(discordUser.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			user = nil
		} else {
			gores.Error(w, 500, fmt.Sprintf("Failed to get user: %v", err))
			return
		}
	}

	discriminator, err := strconv.Atoi(discordUser.Discriminator)
	if err != nil {
		gores.Error(w, 500, fmt.Sprintf("Error: %v", err))
		return
	}

	if user == nil {
		user = &db.User{
			DiscordID:     discordUser.ID,
			Username:      discordUser.Username,
			Discriminator: discriminator,
			Avatar:        discordUser.Avatar,
		}

		defaultAdminIds := viper.GetStringSlice("default_admin_discord_ids")
		for _, id := range defaultAdminIds {
			if user.DiscordID == id {
				user.Role = "admin"
				break
			}
		}

		err = db.CreateUser(user)
	} else {
		user.Username = discordUser.Username
		user.Discriminator = discriminator
		user.Avatar = discordUser.Avatar
		err = db.UpdateUser(user)
	}
	if err != nil {
		gores.Error(w, 500, fmt.Sprintf("Error: %v", err))
		return
	}

	sessionToken := base64.RawURLEncoding.EncodeToString(signer.Sign([]byte(user.DiscordID)))
	gores.HTML(w, http.StatusOK, fmt.Sprintf(`
		<script>
		localStorage.setItem("_t", "%v");
		window.location.href = "/";
		</script>
	`, sessionToken))
}

func (h *HTTPServer) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeaderParts := strings.Split(r.Header.Get("Authorization"), " ")
		if len(authHeaderParts) == 2 && authHeaderParts[0] == "User" {
			rawToken, err := base64.RawURLEncoding.DecodeString(authHeaderParts[1])
			token, err := signer.Unsign(rawToken)
			if err != nil {
				log.Printf("%v", err)
				gores.Error(w, 400, "invalid auth token")
				return
			}

			ctx := context.WithValue(r.Context(), "userId", string(token))
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		} else if len(authHeaderParts) == 2 && authHeaderParts[0] == "UploadKey" {
			ctx := context.WithValue(r.Context(), "UploadKey", authHeaderParts[1])
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (h *HTTPServer) currentUser(w http.ResponseWriter, r *http.Request, must, allowUploadKey bool) *db.User {
	userId := r.Context().Value("userId")
	if userId == nil {
		uploadKey := r.Context().Value("UploadKey")
		if allowUploadKey && uploadKey != nil {
			user, err := db.GetUserByUploadKey(uploadKey.(string))
			if err != nil {
				if must {
					gores.Error(w, 500, "failed to find user")
				}
				return nil
			}

			return user
		}

		if must {
			gores.Error(w, 401, "invalid auth header")
		}
		return nil
	}

	user, err := db.GetUserByID(userId.(string))
	if err != nil {
		if must {
			gores.Error(w, 500, "failed to find user")
		}
		return nil
	}

	return user
}

func (h *HTTPServer) routeGetCurrentUser(w http.ResponseWriter, r *http.Request) {
	currentUser := h.currentUser(w, r, true, false)
	if currentUser == nil {
		return
	}

	gores.JSON(w, http.StatusOK, currentUser)
}
