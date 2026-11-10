// Package design хранит утверждённый источник оформления лендинга.
package design

import _ "embed"

// Home — утверждённая разметка, общая для макета и рабочего лендинга.
//
//go:embed home.html
var Home string
