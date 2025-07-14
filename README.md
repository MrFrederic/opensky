# Dropzone Management System

A modern, full-stack web application for running your dropzone like a well-oiled (and slightly caffeinated) machine.

## Features

- **User Management**: Telegram SSO, roles for everyone from Newby to Administrator
- **Loads & Manifesting**: Organise flights, assign jumps, keep the chaos at bay
- **Digital Logbook**: No more soggy paper logbooks
- **Self-Manifesting**: For those who know what they’re doing (allegedly)
- **API & Docs**: Swagger UI and ReDoc, because we’re not animals

## Tech Stack

- **Backend**: FastAPI, PostgreSQL, SQLAlchemy, Alembic, MinIO, Docker
- **Frontend**: React 18, TypeScript, Vite, Material UI, TanStack Query, Zustand

## Quick Start

### With Docker (Recommended, unless you enjoy pain)

```bash
git clone https://github.com/MrFrederic/dropzone-management.git
cd dropzone-management
cp docker-compose.example.yml docker-compose.yml
# Edit your secrets, tokens, and other bits in docker-compose.yml
docker-compose up --build
```

- Frontend: [http://localhost](http://localhost)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- PgAdmin: [http://localhost:5050](http://localhost:5050) (admin@admin.com / admin)

### Local Development (For the brave)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Contributing

1. Fork, branch, commit, push, pull request.
2. Try not to break production, I'm bad at testing.

## 🗺️ Roadmap

### MVP:
- [ ] Telegram bot as a mobile interface
- [ ] Reception interface
- [ ] Loads dashboard
- [ ] Self-manifesting for sportsmen
- [ ] Multi-language support

### Future Ideas:
- [ ] Dark theme (because who doesn't love a good dark mode)
- [ ] Equipment tracking
- [ ] Equipment booking
- [ ] Real-time notifications via telegram bot

## License

This project is licensed under the [MIT License](./LICENSE). You are free to use, modify, and distribute it as you wish.
*Because sharing is caring* >_<

---

*Built for skydivers, by people who’d rather be in freefall than debugging migrations.*