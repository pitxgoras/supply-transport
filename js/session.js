function checkSession() {
    const savedSession = localStorage.getItem('supply_session');

    if (!savedSession) {
        return null;
    }

    try {
        return JSON.parse(savedSession);
    } catch (error) {
        localStorage.removeItem('supply_session');
        return null;
    }
}

function logout() {
    localStorage.removeItem('supply_session');
    window.location.href = 'login.html';
}