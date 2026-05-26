USE mercato_nova;

INSERT INTO categories (name) VALUES ('Électronique'), ('Vêtements'), ('Livres'), ('Sport'), ('Maison');

-- Mot de passe pour tous : "password123"
INSERT INTO users (name, email, password, role) VALUES
('Admin',       'admin@mercato.fr',   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Alice Vendeur','alice@test.fr',     '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendeur'),
('Bob Acheteur', 'bob@test.fr',       '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'acheteur');

INSERT INTO products (seller_id, category_id, name, description, price, stock) VALUES
(2, 1, 'iPhone 13 reconditionné', 'Très bon état, batterie 90%', 450.00, 3),
(2, 3, 'Clean Code - Robert Martin', 'Édition française, comme neuf', 25.00, 10),
(2, 4, 'Vélo de route Trek', 'Taille M, peu utilisé', 800.00, 1);
