package app

import (
	"fmt"

	"kernel.org/pub/linux/libs/security/libcap/cap"
)

func raisePrivilege() error {
	orig := cap.GetProc()
	c, err := orig.Dup()
	if err != nil {
		return fmt.Errorf("failed to dup caps: %v", err)
	}

	if on, _ := c.GetFlag(cap.Permitted, cap.NET_ADMIN); !on {
		return fmt.Errorf("insufficient privilege to bind to low ports - want %q, have %q", cap.NET_BIND_SERVICE, c)
	}

	if err := c.SetFlag(cap.Effective, true, cap.NET_ADMIN); err != nil {
		return fmt.Errorf("unable to set capability: %v", err)
	}

	if on, _ := c.GetFlag(cap.Permitted, cap.NET_RAW); !on {
		return fmt.Errorf("insufficient privilege to bind to low ports - want %q, have %q", cap.NET_BIND_SERVICE, c)
	}

	if err := c.SetFlag(cap.Effective, true, cap.NET_RAW); err != nil {
		return fmt.Errorf("unable to set capability: %v", err)
	}

	if err := c.SetProc(); err != nil {
		return fmt.Errorf("unable to raise capabilities %q: %v", c, err)
	}

	return nil
}
