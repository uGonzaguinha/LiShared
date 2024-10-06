document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 60, // Adjust for fixed header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Button click handlers
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    const learnMoreBtn = document.querySelector('.learn-more-btn');

    loginBtn.addEventListener('click', () => {
        alert('Funcionalidade de login em desenvolvimento!');
    });

    signupBtn.addEventListener('click', () => {
        alert('Funcionalidade de cadastro em desenvolvimento!');
    });

    learnMoreBtn.addEventListener('click', () => {
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
            window.scrollTo({
                top: featuresSection.offsetTop - 60,
                behavior: 'smooth'
            });
        }
    });
});