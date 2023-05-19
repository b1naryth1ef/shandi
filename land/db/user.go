package db

import "math/rand"

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randSeq(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

type User struct {
	DiscordID     string          `json:"discord_id" gorm:"primaryKey"`
	Username      string          `json:"username"`
	Discriminator int             `json:"discriminator"`
	Avatar        string          `json:"avatar"`
	Role          string          `json:"role"`
	UploadKeys    []UserUploadKey `json:"upload_keys"`
}

type UserUploadKey struct {
	Key    string `json:"key" gorm:"primaryKey"`
	UserID string `json:"-"`
}

func GetUserByID(id string) (*User, error) {
	var user User
	err := db.Preload("UploadKeys").First(&user, "discord_id = ?", id).Error
	return &user, err
}

func GetUserByUploadKey(key string) (*User, error) {
	var user User
	return &user, db.Model(&User{}).Joins("left join user_upload_keys on user_upload_keys.user_id = users.discord_id").First(&user, "user_upload_keys.key = ?", key).Error
}

func CreateUser(user *User) error {
	return db.Create(user).Error
}

func UpdateUser(user *User) error {
	return db.Save(user).Error
}

func DeleteUserUploadKey(key string) error {
	return db.Delete(&UserUploadKey{}, "key = ?", key).Error
}

func CreateUserUploadKey(id string) (string, error) {
	key := randSeq(32)
	return key, db.Create(&UserUploadKey{
		Key:    key,
		UserID: id,
	}).Error

}
