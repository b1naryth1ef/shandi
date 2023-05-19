package main

import (
	"os"

	"github.com/kr/binarydist"
)

func main() {
	if len(os.Args) < 4 {
		panic("Usage: <old> <new> <diff>")
	}

	old, err := os.Open(os.Args[1])
	if err != nil {
		panic(err)
	}

	new, err := os.Open(os.Args[2])
	if err != nil {
		panic(err)
	}

	diff, err := os.Create(os.Args[3])
	if err != nil {
		panic(err)
	}

	err = binarydist.Diff(old, new, diff)
	if err != nil {
		panic(err)
	}

}
