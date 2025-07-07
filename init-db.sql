-- Initialize some basic dictionaries and values for the system

-- create tables if they don't exist
CREATE TABLE IF NOT EXISTS dictionaries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS dictionary_values (
    id SERIAL PRIMARY KEY,
    dictionary_id INTEGER NOT NULL REFERENCES dictionaries(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Create dictionaries
INSERT INTO dictionaries (name, is_system, is_active) VALUES 
    ('jump_type', true, true),
    ('equipment_type', true, true),
    ('equipment_name', true, true),
    ('equipment_status', true, true),
    ('load_status', true, true),
    ('payment_status', true, true);

-- Get dictionary IDs (we'll use hardcoded values for simplicity)
-- In a real deployment, you'd want to handle this more carefully

-- Jump types
INSERT INTO dictionary_values (dictionary_id, value, is_system, is_active) VALUES 
    (1, 'tandem', true, true),
    (1, 'sport', true, true),
    (1, 'aff', true, true),
    (1, 'aff_instructor', true, true);

-- Equipment types
INSERT INTO dictionary_values (dictionary_id, value, is_system, is_active) VALUES 
    (2, 'main_parachute', true, true),
    (2, 'reserve_parachute', true, true),
    (2, 'safety_device', true, true),
    (2, 'harness', true, true),
    (2, 'helmet', true, true);

-- Equipment names (examples)
INSERT INTO dictionary_values (dictionary_id, value, is_system, is_active) VALUES 
    (3, 'Д1-5-У', false, true),
    (3, 'ПКУ', false, true),
    (3, 'Cypres 2', false, true),
    (3, 'Vigil+', false, true),
    (3, 'Student Harness', false, true);

-- Equipment status
INSERT INTO dictionary_values (dictionary_id, value, is_system, is_active) VALUES 
    (4, 'available', true, true),
    (4, 'maintenance', true, true),
    (4, 'out_of_service', true, true),
    (4, 'reserved', true, true);

-- Load status
INSERT INTO dictionary_values (dictionary_id, value, is_system, is_active) VALUES 
    (5, 'planned', true, true),
    (5, 'boarding', true, true),
    (5, 'airborne', true, true),
    (5, 'completed', true, true),
    (5, 'cancelled', true, true);

-- Payment status
INSERT INTO dictionary_values (dictionary_id, value, is_system, is_active) VALUES 
    (6, 'pending', true, true),
    (6, 'paid', true, true),
    (6, 'free', true, true),
    (6, 'waived', true, true);
