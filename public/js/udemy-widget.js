(function() {
    // 1. Guard clause: Prevent running twice if accidentally imported multiple times
    if (document.getElementById('udemy-sticky-widget-container')) return;

    // 2. Define the CSS Styles
    const cssStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        .student-offer-widget {
            position: fixed;
            top: 9rem;
            right: 2rem;
            z-index: 2147483647; /* Max z-index */
            background-color: #ffffff;
            color: #1f2937;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            padding: 16px;
            border-radius: 12px;
            max-width: 320px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            animation: udemySlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease;
        }

        .student-offer-widget:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .student-offer-widget .student-icon {
            font-size: 24px;
            line-height: 1;
            flex-shrink: 0;
            background-color: #eff6ff;
            padding: 10px;
            border-radius: 10px;
            border: 1px solid #dbeafe;
        }

        .student-offer-widget .offer-content {
            flex: 1;
        }

        .student-offer-widget strong {
            display: block;
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 4px;
            color: #111827;
            letter-spacing: -0.01em;
        }

        .student-offer-widget p {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
            color: #4b5563;
        }

        .student-offer-widget .highlight-80 {
            color: #dc2626;
            background-color: #fef2f2;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 4px;
            border: 1px solid #fee2e2;
            white-space: nowrap;
        }

        .student-offer-widget .offer-close-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: none;
            background: transparent;
            color: #9ca3af;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            line-height: 1;
            transition: all 0.2s;
            padding: 0;
        }

        .student-offer-widget .offer-close-btn:hover {
            background-color: #f3f4f6;
            color: #374151;
        }

        @keyframes udemySlideIn {
            0% { opacity: 0; transform: translateX(100%) scale(0.95); }
            100% { opacity: 1; transform: translateX(0) scale(1); }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            .student-offer-widget { background-color: #1e293b; border-color: #334155; }
            .student-offer-widget strong { color: #f8fafc; }
            .student-offer-widget p { color: #94a3b8; }
            .student-offer-widget .student-icon { background-color: #0f172a; border-color: #1e293b; }
            .student-offer-widget .highlight-80 { background-color: #450a0a; color: #fca5a5; border-color: #7f1d1d; }
            .student-offer-widget .offer-close-btn:hover { background-color: #334155; color: #fff; }
        }
    `;

    // 3. Define the HTML Structure
    const widgetHTML = `
        <div class="student-offer-widget" id="udemyStickyOffer">
            <button class="offer-close-btn" id="udemyOfferCloseBtn" aria-label="Close offer">&times;</button>
            <span class="student-icon">🎓</span> 
            <div class="offer-content">
                <strong>Udemy Student?</strong>
                <p>Check your course dashboard for an exclusive <span class="highlight-80">80% OFF</span> coupon.</p>
            </div>
        </div>
    `;

    // 4. Function to Initialize the Widget
    function initWidget() {
        // Create and append style element
        const styleSheet = document.createElement("style");
        styleSheet.textContent = cssStyles;
        document.head.appendChild(styleSheet);

        // Create container and append HTML
        const container = document.createElement("div");
        container.id = "udemy-sticky-widget-container";
        container.innerHTML = widgetHTML;
        document.body.appendChild(container);

        // Add Event Listener for Closing
        const closeBtn = document.getElementById('udemyOfferCloseBtn');
        const widget = document.getElementById('udemyStickyOffer');

        if (closeBtn && widget) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent bubbling
                
                // Animate out
                widget.style.opacity = '0';
                widget.style.transform = 'translateY(-10px) scale(0.95)';
                widget.style.pointerEvents = 'none';
                
                // Remove from DOM after animation
                setTimeout(() => {
                    container.remove();
                }, 300);
            });
        }
    }

    // 5. Run Initialization (wait for DOM if needed)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

})();