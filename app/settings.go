package app

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
)

type Settings struct {
	DataPath string `json:"-"`
	OnUpdate func() `json:"-"`

	Developer            bool              `json:"developer"`
	RunInBackground      bool              `json:"run_in_background"`
	FirstTimeSetup       bool              `json:"first_time_setup"`
	CaptureInterfaceName *string           `json:"capture_interface_name"`
	AutoSave             *AutoSaveSettings `json:"auto_save"`
	Land                 LandSettings      `json:"land"`
}

type LandSettings struct {
	URLOverride    *string `json:"url_override"`
	AlwaysReupload bool    `json:"always_reupload"`
	UploadKey      *string `json:"upload_key"`
	AutoUpload     bool    `json:"auto_upload"`
}

type AutoSaveSettings struct {
	UnknownEncounters bool `json:"unknown_encounters"`
}

func (s *Settings) Path() string {
	return filepath.Join(s.DataPath, "settings.json")
}

func (s *Settings) Update(other *Settings) {
	s.Developer = other.Developer
	s.RunInBackground = other.RunInBackground
	s.FirstTimeSetup = other.FirstTimeSetup
	s.CaptureInterfaceName = other.CaptureInterfaceName
	s.AutoSave = other.AutoSave
	s.Land = other.Land

	err := s.Save()
	if err != nil {
		logger.Error().Err(err).Msg("failed to save settings")
	}
	s.OnUpdate()
}

func (s *Settings) Save() error {
	data, err := json.Marshal(s)
	if err != nil {
		return err
	}
	return ioutil.WriteFile(s.Path(), data, os.ModePerm)
}

func (s *Settings) Load() error {
	data, err := ioutil.ReadFile(s.Path())
	if err != nil {
		if os.IsNotExist(err) {
			return s.Save()
		}

		return err
	}
	return json.Unmarshal(data, s)
}

func NewSettings(dataPath string) (*Settings, error) {
	settings := &Settings{
		DataPath: dataPath,
	}
	return settings, settings.Load()
}
