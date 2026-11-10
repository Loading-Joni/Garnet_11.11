package web

import (
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestLanding(t *testing.T) {
	s := &Server{}
	w := httptest.NewRecorder()
	s.handleLanding(w, httptest.NewRequest("GET", "/", nil))
	if w.Code != 200 {
		t.Fatal(w.Code)
	}
	for _, text := range []string{`hx-boost="true"`, `hx-post="/request"`, `name="phone"`, `/static/landing.js`, `dir-implant`, `dir-veneer`, `178 000 ₽`} {
		if !strings.Contains(w.Body.String(), text) {
			t.Errorf("отсутствует %s", text)
		}
	}
	for _, text := range []string{"Три детали — одна конструкция", "Наглядная схема, не модель конкретного производителя.", "{{.AppName}}"} {
		if strings.Contains(w.Body.String(), text) {
			t.Errorf("лишний текст %s", text)
		}
	}
}

func TestRequestNeverClaimsUndeliveredSuccess(t *testing.T) {
	for _, tc := range []struct{ phone, consent, want string }{
		{"123", "yes", "Проверьте номер"},
		{"+7 (918) 222-73-36", "", "необходимо согласие"},
		{"+7 (918) 222-73-36", "yes", "Заявка не отправлена"},
	} {
		t.Run(tc.want, func(t *testing.T) {
			data := url.Values{"phone": {tc.phone}, "consent": {tc.consent}}
			r := httptest.NewRequest("POST", "/request", strings.NewReader(data.Encode()))
			r.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			w := httptest.NewRecorder()
			(&Server{}).handleRequest(w, r)
			if !strings.Contains(w.Body.String(), tc.want) {
				t.Fatal(w.Body.String())
			}
			if strings.Contains(w.Body.String(), "<html") {
				t.Fatal("ожидался фрагмент")
			}
		})
	}
}

func TestLandingStyle(t *testing.T) {
	w := httptest.NewRecorder()
	(&Server{}).handleLandingStyle(w, httptest.NewRequest("GET", "/static/landing.css", nil))
	if !strings.Contains(w.Body.String(), "Montserrat") || strings.Contains(w.Body.String(), "</style>") {
		t.Fatal("неверные стили")
	}
}
