const numberFormat = /^01[0-9]{9}$/; // Format for phone number

        // Toggle forms and move buttons below the form
        function showForm(form) {
            const loginForm = document.getElementById("login-form-container");
            const signupForm = document.getElementById("signup-form-container");
            const buttonContainer = document.getElementById("button-container");

            if (form === "login") {
                loginForm.style.display = "block";
                signupForm.style.display = "none";
            } else {
                signupForm.style.display = "block";
                loginForm.style.display = "none";
            }

            // Move button container below the displayed form
            const activeForm = form === "login" ? loginForm : signupForm;
            activeForm.insertAdjacentElement("afterend", buttonContainer);
        }

        // Login function
        async function handleLogin() {
            const number = document.getElementById("login-number").value.trim();
            const password = document.getElementById("login-password").value.trim();
            const error = document.getElementById("login-error");
            const success = document.getElementById("login-success");

            error.innerText = "";
            success.innerText = "";

            if (!numberFormat.test(number)) {
                error.innerText = "Invalid number format! Use 01XXXXXXXXX.";
                return;
            }

            if (password.length !== 6) {
                error.innerText = "Password must be exactly 6 characters.";
                return;
            }

            // Backend API call
            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: number, password: password }),
                });

                const result = await response.json();
                if (response.ok) {
                    success.innerText = result.message;
                    setTimeout(() => window.location.href = "/home", 1500); // Redirect after 1.5s
                } else {
                    error.innerText = result.message;
                }
            } catch (err) {
                error.innerText = "Server error during login!";
            }
        }

        // Sign-Up function
        async function handleSignUp() {
            const number = document.getElementById("signup-number").value.trim();
            const password = document.getElementById("signup-password").value.trim();
            const error = document.getElementById("signup-error");
            const success = document.getElementById("signup-success");

            error.innerText = "";
            success.innerText = "";

            if (!numberFormat.test(number)) {
                error.innerText = "Invalid number format! Use 01XXXXXXXXX.";
                return;
            }

            if (password.length !== 6) {
                error.innerText = "Password must be exactly 6 characters.";
                return;
            }

            // Backend API call
            try {
                const response = await fetch("/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: number, password: password }),
                });

                const result = await response.json();
                if (response.ok) {
                    success.innerText = result.message;
                    document.getElementById("signup-form").reset(); // Clear form fields
                    setTimeout(() => window.location.href = "/", 2200); // Redirect after 1.5s
                } else {
                    error.innerText = result.message;
                }
            } catch (err) {
                error.innerText = "Server error during registration!";
            }
        }