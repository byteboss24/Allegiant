from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from app.core import state

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Hardcoded login
USERNAME = "admin"
PASSWORD = "secret"

def check_auth(request: Request):
    username = request.cookies.get("username")
    password = request.cookies.get("password")
    if username != USERNAME or password != PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/admin/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/admin/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if username == USERNAME and password == PASSWORD:
        response = RedirectResponse(url="/admin", status_code=302)
        response.set_cookie("username", username)
        response.set_cookie("password", password)
        return response
    return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})

@router.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request, _: None = Depends(check_auth)):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "data": state.admin_config if state.admin_config else None
    })

@router.post("/admin", response_class=HTMLResponse)
async def admin_submit(
    request: Request,
    # phone_number: str = Form(...),
    twilio_account_sid: str = Form(...),
    twilio_auth_token: str = Form(...),
    welcome_message: str = Form(...),
    prompt: str = Form(...),
    # speed: float = Form(...),
    webhook_url = Form(...),
    voice: str = Form(...),
    _: None = Depends(check_auth)
):
    # Save to shared state
    state.admin_config = {
        # "phone_number": phone_number,
        "twilio_account_sid": twilio_account_sid ,
        "twilio_auth_token": twilio_auth_token ,
        "welcome_message": welcome_message,
        "prompt": prompt,
        'webhook_url': webhook_url,
        # "speed": speed,
        "voice": voice,
    }
    print("data ", state.admin_config)

    return templates.TemplateResponse("admin.html", {
        "request": request,
        "success": True,
        "data": state.admin_config
    })