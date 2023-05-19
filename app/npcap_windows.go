package app

import (
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"syscall"

	"golang.org/x/sys/windows"
)

func execElevated(exe string) error {
	elevated := windows.GetCurrentProcessToken().IsElevated()
	if elevated {
		c := exec.Command(exe)
		return c.Run()
	}

	verb := "runas"
	cwd, err := os.Getwd()
	if err != nil {
		return err
	}

	verbPtr, err := syscall.UTF16PtrFromString(verb)
	if err != nil {
		return err
	}
	exePtr, err := syscall.UTF16PtrFromString(exe)
	if err != nil {
		return err
	}
	cwdPtr, err := syscall.UTF16PtrFromString(cwd)
	if err != nil {
		return err
	}
	argPtr, err := syscall.UTF16PtrFromString("")
	if err != nil {
		return err
	}

	var showCmd int32 = 1 //SW_NORMAL

	err = windows.ShellExecute(0, verbPtr, exePtr, argPtr, cwdPtr, showCmd)
	if err != nil {
		return err
	}

	return nil
}

const npcapInstallerURL = `https://npcap.com/dist/npcap-1.74.exe`

func downloadNpcap() error {
	file, err := ioutil.TempFile("", "*-npcap-installer.exe")
	if err != nil {
		return err
	}
	defer os.Remove(file.Name())

	resp, err := http.Get(npcapInstallerURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	_, err = io.Copy(file, resp.Body)
	if err != nil {
		return err
	}
	file.Close()

	return execElevated(file.Name())
}
