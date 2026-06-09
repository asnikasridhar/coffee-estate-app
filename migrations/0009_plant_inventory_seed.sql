INSERT INTO plant_inventory (property_id, block_id, sub_block_name, plant_id, plant_count, planting_date, notes, created_by)
SELECT 1, 1, 'Main row A', 2, 1800, '2021-06-15', 'Sample inventory for Manjushree Block A', 'seed'
WHERE NOT EXISTS (SELECT 1 FROM plant_inventory WHERE property_id = 1 AND block_id = 1 AND plant_id = 2 AND sub_block_name = 'Main row A');

INSERT INTO plant_inventory (property_id, block_id, sub_block_name, plant_id, plant_count, planting_date, notes, created_by)
SELECT 1, 3, 'North patch', 1, 1200, '2020-07-10', 'Sample inventory for Manjushree Block B', 'seed'
WHERE NOT EXISTS (SELECT 1 FROM plant_inventory WHERE property_id = 1 AND block_id = 3 AND plant_id = 1 AND sub_block_name = 'North patch');

INSERT INTO plant_inventory (property_id, block_id, sub_block_name, plant_id, plant_count, planting_date, notes, created_by)
SELECT 1, 5, 'Sub block nursery', 3, 650, '2023-08-20', 'Sample inventory for sub block', 'seed'
WHERE NOT EXISTS (SELECT 1 FROM plant_inventory WHERE property_id = 1 AND block_id = 5 AND plant_id = 3 AND sub_block_name = 'Sub block nursery');
