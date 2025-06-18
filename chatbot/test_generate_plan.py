from chatbot.handlers.plan_handler import handle_plan_request

user_profile = {
    "basicInfo": {
        "name": "John Doe",
        "email": "john@example.com",
        "birthday": "1990-05-15",
        "employmentStatus": "Employed"
    },
    "financialInfo": {
        "annualIncome": 75000,
        "annualExpenses": 55000,
        "totalAssets": 150000,
        "totalDebts": 80000,
        "currentSavings": 25000
    },
    "financialGoal": {
        "targetAmount": 1000000,
        "targetYear": 2035
    },
    "experience": [
        {
            "company": "Tech Corp",
            "position": "Software Engineer",
            "startYear": "2020",
            "endYear": "Present"
        }
    ],
    "skillsAndInterests": {
        "skills": ["JavaScript", "React", "Node.js"],
        "interests": ["Technology", "Investing", "Fitness"]
    }
}

goal_data = {
    "goalTitle": "Reach $1M net worth by 2035",
    "goalDescription": "I want to save and invest wisely to reach $1M in total assets by the time I turn 45.",
    "targetAmount": 1000000,
    "targetYear": 2035,
    "riskLevel": "medium",
    "timeframe": "10 years",
    "skillsLevel": "advanced",
    "skillsIncomeUse": True,
    "growthComfort": "balanced",
    "constraints": ["high rent", "student loans"]
}

response = handle_plan_request(user_profile, goal_data)

if response["success"]:
    from rich import print
    print("[bold green]✅ Generated Plan:[/bold green]")
    print(response["plan"])
else:
    print("❌ Error generating plan:", response["error"])
