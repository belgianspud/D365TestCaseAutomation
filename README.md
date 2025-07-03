🧪 D365TestCaseAutomation
Automated testing framework for Microsoft Dynamics 365 Model-Driven Apps using Playwright and Python. Designed to streamline UI test case creation, execution, and management for enterprise-level D365 applications.

🚀 Features
✅ Automate user actions within D365 Model-Driven Apps

🔐 Secure login with Microsoft SSO

🌐 Cross-browser support (Chromium, Firefox, WebKit via Playwright)

🧱 Modular structure using Page Object Model (POM)

📈 Extensible with custom test cases

⚙️ Built-in environment config management

📄 Generates detailed test logs and artifacts

📂 Project Structure
bash

D365TestCaseAutomation/
│
├── backend/                # Python test logic & Playwright integration
│   ├── app/
│   │   ├── core/           # Core logic for launching and controlling the browser
│   │   ├── models/         # Page models or test-specific logic
│   │   └── utils/          # Reusable helpers
│   └── tests/              # Actual test case scripts
│
├── frontend/               # (Planned) Svelte-based UI for managing test suites
│
├── .env                    # Configuration variables (excluded from version control)
├── README.md
└── requirements.txt        # Python dependencies
⚙️ Setup & Installation
1. Clone the Repo
bash

git clone https://github.com/belgianspud/D365TestCaseAutomation.git
cd D365TestCaseAutomation
2. Install Python Dependencies
Use a virtual environment if possible

bash

pip install -r requirements.txt
3. Install Playwright Browsers
bash

playwright install
4. Create .env File
Create a .env file in the root directory with values like:

env

D365_BASE_URL=https://your-org.crm.dynamics.com
USERNAME=your.email@example.com
PASSWORD=yourSecurePassword
TENANT_ID=your-azure-tenant-guid
▶️ Running the Tests
From the backend/ directory:

bash

python -m pytest tests/
Or launch specific test modules:

bash

pytest tests/test_login.py
📊 Output & Artifacts
Test runs will generate:

Console logs

Screenshots on failure

Optional: video recordings (if configured)

Artifacts will be stored in a designated /reports/ or /artifacts/ directory.

🧱 Planned Features
 CI/CD Integration (GitHub Actions)

 Frontend Test Manager with Svelte

 Test result dashboard

 OAuth interactive login support

 Azure SQL test case result logging

🧑‍💻 Contributing
Fork the repo

Create your feature branch (git checkout -b feature/foo)

Commit your changes

Push to the branch (git push origin feature/foo)

Create a Pull Request

📄 License
MIT License. See LICENSE for details.

🤝 Acknowledgements
Built using:

Playwright

Python

Svelte (planned UI layer)

Microsoft Dynamics 365
