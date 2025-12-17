class LiveDemoButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); // Encapsulates styles so they don't clash
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            /* Copied CSS */
            .live-demo-btn {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 12px;
                background-color: #2563eb;
                color: #ffffff;
                padding: 10px 20px;
                border-radius: 9999px;
                border: 1px solid rgba(96, 165, 250, 0.5);
                font-family: system-ui, -apple-system, sans-serif;
                font-weight: 700;
                text-decoration: none;
                line-height: 1;
                box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 
                            0 4px 6px -2px rgba(37, 99, 235, 0.3);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .live-demo-btn:hover {
                background-color: #3b82f6;
                transform: translateY(-2px);
                box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4), 
                            0 10px 10px -5px rgba(37, 99, 235, 0.4);
            }

            .live-demo-btn:hover .btn-text {
                letter-spacing: 0.05em;
            }
            .btn-text {
                transition: letter-spacing 0.3s ease;
            }

            .indicator-container {
                position: relative;
                display: flex;
                height: 10px;
                width: 10px;
            }

            .indicator-ping {
                position: absolute;
                display: inline-flex;
                height: 100%;
                width: 100%;
                border-radius: 50%;
                background-color: #ffffff;
                opacity: 0.75;
                animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
            }

            .indicator-dot {
                position: relative;
                display: inline-flex;
                border-radius: 50%;
                height: 10px;
                width: 10px;
                background-color: #ffffff;
            }

            @keyframes ping {
                75%, 100% {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        </style>

        <a href="/client" target="_blank" class="live-demo-btn">
            <span class="indicator-container">
                <span class="indicator-ping"></span>
                <span class="indicator-dot"></span>
            </span>
            <span class="btn-text">View Live Demo</span>
        </a>
        `;
    }
}

// Define the custom element
customElements.define('live-demo-btn', LiveDemoButton);