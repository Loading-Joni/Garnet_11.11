package web

import (
	"html/template"
	"net/http"
	"strings"

	"github.com/chudno/zerovibe/design"
	"github.com/chudno/zerovibe/internal/domain"
)

// landingSource сохраняет утверждённое оформление без отдельной расходящейся копии.
func landingSource() string {
	source := strings.ReplaceAll(design.Home, "Гарнет", "{{.AppName}}")
	source = strings.Replace(source, "<body>", `<body hx-boost="true">`, 1)
	source = strings.Replace(source, "</head>", `<script src="/static/htmx.min.js"></script><script defer src="/static/landing.js"></script><link rel="stylesheet" href="/static/landing-motion.css"></head>`, 1)
	source = strings.Replace(source, `<div class="contact-form" id="request">`, `<form class="contact-form" id="request" hx-post="/request" hx-target="#request-feedback" hx-swap="innerHTML show:none">`, 1)
	source = strings.Replace(source, `aria-label="Ваше имя"`, `name="name" maxlength="100" autocomplete="name" aria-label="Ваше имя"`, 1)
	source = strings.Replace(source, `aria-label="Номер телефона"`, `name="phone" aria-label="Номер телефона"`, 1)
	source = strings.Replace(source, `type="checkbox" required`, `type="checkbox" name="consent" value="yes" required`, 1)
	source = strings.Replace(source, `<button class="btn" type="button">Оставить заявку ↗</button>`, `<input type="hidden" name="calculation" id="request-calculation"><button class="btn" type="submit">Оставить заявку ↗</button><div id="request-feedback" role="status" aria-live="polite"></div>`, 1)
	source = strings.Replace(source, `Можно также позвонить или написать в MAX.</p></div></div></section>`, `Можно также позвонить или написать в MAX.</p></form></div></section>`, 1)
	return source
}

var landingTemplate = template.Must(template.New("landing").Parse(landingSource()))

func (s *Server) applicationName(r *http.Request) string {
	name := ""
	for _, def := range domain.SettingDefs() {
		if def.Key == "app_name" {
			name = def.Default
			break
		}
	}
	if s.settings != nil {
		if value, err := s.settings.String(r.Context(), "app_name"); err == nil && value != "" {
			name = value
		}
	}
	return name
}

func (s *Server) handleLanding(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := landingTemplate.Execute(w, pageData{AppName: s.applicationName(r)}); err != nil {
		http.Error(w, "Не удалось открыть страницу", http.StatusInternalServerError)
	}
}

func (s *Server) handleLandingStyle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/css; charset=utf-8")
	start := strings.Index(design.Home, "<style>") + len("<style>")
	end := strings.Index(design.Home, "</style>")
	_, _ = w.Write([]byte(design.Home[start:end]))
}

// handleRequest не сообщает об отправке, пока доставка в клинику не подключена.
func (s *Server) handleRequest(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := r.ParseForm(); err != nil {
		_, _ = w.Write([]byte(`<p>Не удалось обработать заявку. Позвоните в клинику.</p>`))
		return
	}
	digits := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, r.FormValue("phone"))
	if len(digits) != 11 || (digits[0] != '7' && digits[0] != '8') {
		_, _ = w.Write([]byte(`<p>Проверьте номер телефона: нужен российский номер из 11 цифр.</p>`))
		return
	}
	if r.FormValue("consent") != "yes" {
		_, _ = w.Write([]byte(`<p>Для отправки необходимо согласие на обработку персональных данных.</p>`))
		return
	}
	_, _ = w.Write([]byte(`<p>Заявка не отправлена: приём заявок через форму пока не подключён. Позвоните <a href="tel:+79182227336">+7 918 222-73-36</a> или воспользуйтесь кнопкой «Написать в MAX» рядом.</p>`))
}
