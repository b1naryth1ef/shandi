package db

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

func OpenDatabase(path string) error {
	it, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return err
	}
	db = it

	err = db.AutoMigrate(&Battle{}, &User{}, &UserUploadKey{})
	if err != nil {
		return err
	}

	return nil
}
