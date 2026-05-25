-- V2__seed_data.sql
-- Seed recommendations and default admin user

INSERT INTO recommendations (risk_level, recommendation_text)
VALUES ('Low', 'Maintain your current healthy lifestyle — you are doing great!'),
       ('Low', 'Continue a balanced diet rich in whole grains, vegetables, and lean proteins.'),
       ('Low', 'Keep up regular physical activity — aim for at least 150 minutes per week.'),
       ('Low', 'Schedule annual health check-ups to monitor your glucose levels.'),
       ('Medium', 'Your risk is moderate — take proactive steps now to prevent progression.'),
       ('Medium', 'Reduce sugar and refined carbohydrate intake significantly.'),
       ('Medium', 'Monitor your blood glucose levels at least once a month.'),
       ('Medium', 'Work toward achieving a healthy BMI through diet and regular exercise.'),
       ('Medium', 'If you smoke, consider enrolling in a cessation program immediately.'),
       ('High', 'High risk detected — please consult a healthcare professional urgently.'),
       ('High', 'Schedule an appointment with an endocrinologist or diabetologist.'),
       ('High', 'Follow a strict low-glycemic diet and eliminate all processed foods.'),
       ('High', 'Consider regular HbA1c and fasting glucose testing every 3 months.'),
       ('High', 'Begin a supervised daily exercise program — minimum 30 minutes per day.'),
       ('High', 'Discuss preventive medication options with your doctor.');

-- Default admin (password = "admin123" BCrypt hash — CHANGE IN PRODUCTION)
-- Hash verified correct for password: admin123
INSERT INTO users (name, email, password, role)
VALUES ('GlucoTwin Admin', 'admin@glucotwin.ai',
        '$2a$10$OXDBk67TaneIRqJVZElOGu0SDpWKquaPSC9Cws2YLlOcfQlK1vHhi', 'ADMIN')
ON DUPLICATE KEY UPDATE id = id;
