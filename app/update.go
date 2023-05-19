package app

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/google/go-github/v52/github"
	"github.com/kr/binarydist"
	"golang.org/x/mod/semver"
)

var version string = "dev"

func GetVersion() string {
	return version
}

func getPlatformExecutableName() string {
	if runtime.GOOS == "windows" {
		return "shandi.exe"
	}
	return fmt.Sprintf("shandi-%s-%s", runtime.GOOS, runtime.GOARCH)
}

func tryDownloadPatch(release *github.RepositoryRelease) (string, error) {
	platformExecutableName := getPlatformExecutableName()

	var targetAssetURL string = ""
	for _, asset := range release.Assets {
		if strings.HasSuffix(*asset.Name, platformExecutableName+".patch") {
			prefixParts := strings.Split(*asset.Name, "-")
			if prefixParts[0] != version {
				continue
			}
			targetAssetURL = *asset.URL
			break
		}

	}
	if targetAssetURL == "" {
		return "", errors.New("failed to find suitable file")
	}

	logger.Info().Str("url", targetAssetURL).Msg("downloading binary patch")
	req, err := http.NewRequest("GET", targetAssetURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Accept", "application/octet-stream")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download file: %v", resp.StatusCode)
	}

	patch := bytes.NewBuffer([]byte{})

	_, err = io.Copy(patch, resp.Body)
	if err != nil {
		return "", err
	}

	oldExe, err := os.Executable()
	if err != nil {
		return "", err
	}

	old, err := os.Open(oldExe)
	if err != nil {
		return "", err
	}
	defer old.Close()

	exe, err := ioutil.TempFile("", "shandi-update-exe")
	if err != nil {
		return "", err
	}

	err = binarydist.Patch(old, exe, bytes.NewReader(patch.Bytes()))
	if err != nil {
		return "", err
	}
	exe.Close()

	return exe.Name(), nil
}

func tryDownloadExecutable(release *github.RepositoryRelease) (string, error) {
	platformExecutableName := getPlatformExecutableName()

	var targetAssetURL string = ""
	for _, asset := range release.Assets {
		if strings.HasSuffix(*asset.Name, platformExecutableName) {
			targetAssetURL = *asset.URL
			break
		}
	}
	if targetAssetURL == "" {
		return "", errors.New("failed to find suitable file")
	}

	logger.Info().Str("url", targetAssetURL).Msg("downloading full executable")
	req, err := http.NewRequest("GET", targetAssetURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Accept", "application/octet-stream")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download file: %v", resp.StatusCode)
	}

	exec, err := ioutil.TempFile("", "shandi-update-executable")
	if err != nil {
		return "", err
	}

	_, err = io.Copy(exec, resp.Body)
	if err != nil {
		return "", err
	}
	exec.Close()

	return exec.Name(), nil
}

func DownloadRelease(release *github.RepositoryRelease) (string, error) {
	logger.Info().Str("version", *release.Name).Msg("downloading latest release")
	exe, err := tryDownloadPatch(release)
	if err == nil {
		return exe, err
	}
	logger.Error().Err(err).Msg("failed to download patch")

	exe, err = tryDownloadExecutable(release)
	if err == nil {
		return exe, err
	}
	logger.Error().Err(err).Msg("failed to download full exe")

	return "", errors.New("no valid download file found")
}

func ApplyRelease(releaseExePath string) error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	dir := filepath.Dir(exe)
	base := filepath.Base(exe)
	old := filepath.Join(dir, fmt.Sprintf("%s.old", base))

	_ = os.Remove(old)

	err = os.Rename(exe, old)
	if err != nil {
		return err
	}

	err = os.Rename(releaseExePath, exe)
	if err != nil {
		// rollback
		os.Rename(old, exe)
		return err
	}

	return nil
}

func CleanupOldRelease() error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	if _, err = os.Stat(exe + ".old"); err == nil {
		os.Remove(exe + ".old")
	}

	return nil
}

func GetNewRelease() *github.RepositoryRelease {
	client := github.NewClient(nil)
	release, res, err := client.Repositories.GetLatestRelease(context.Background(), "b1naryth1ef", "shandi")
	if err != nil {
		logger.Error().Err(err).Interface("res", res).Msg("failed to fetch latest release from github")
		return nil
	}

	if version == "" {
		logger.Warn().Msg("running build without version set")
		return nil
	} else if version == "dev" {
		logger.Info().Msg("not checking for updates, running developer build")
		return nil
	}

	if semver.Compare(version, *release.Name) == -1 {
		return release
	}

	return nil
}
