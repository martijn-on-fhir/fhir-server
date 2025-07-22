$(document).ready(function() {
    // Check periodically until topbar is available
    const addLogo = setInterval(function() {
        if ($('.topbar-wrapper').length) {
            $('.topbar-wrapper').prepend(`
                <img src="/logo-adapcare.svg" 
                     alt="Company Logo" 
                     style="height: 36px; margin-right: 20px;">
            `);
            clearInterval(addLogo);
        }
    }, 100);
});
