<?php
// Endpoint vendeur : depot et suivi d'une demande pour devenir vendeur.
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/csrf.php';

setCorsHeaders();
configureSession();
header('Content-Type: application/json');

$user = requireAuth();
$pdo  = getDB();

// GET : renvoie la derniere demande de l'utilisateur connecte.
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT etat, created_at FROM demandes_vendeur WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $demande = $stmt->fetch();
    echo json_encode(['demande' => $demande ?: null]);
    exit;
}

// POST : cree une nouvelle demande vendeur apres verification CSRF.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrfToken();

    if (in_array($user['role'], ['vendeur', 'admin'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Vous êtes déjà vendeur.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, etat FROM demandes_vendeur WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch();

    if ($existing && in_array($existing['etat'], ['en_attente', 'approuve'])) {
        http_response_code(409);
        $msg = $existing['etat'] === 'approuve'
            ? 'Votre demande a déjà été approuvée.'
            : 'Vous avez déjà une demande en cours de traitement.';
        echo json_encode(['success' => false, 'error' => $msg]);
        exit;
    }

    $body        = json_decode(file_get_contents('php://input'), true);
    $nom_boutique = trim($body['nom_boutique'] ?? '');
    $description  = trim($body['description'] ?? '');
    $categories   = isset($body['categories']) && is_array($body['categories'])
        ? json_encode($body['categories']) : '[]';
    $experience   = trim($body['experience'] ?? '');
    $site_web     = trim($body['site_web'] ?? '') ?: null;
    $telephone    = trim($body['telephone'] ?? '') ?: null;
    $motivation   = trim($body['motivation'] ?? '');

    if (!$nom_boutique || !$description || !$experience || !$motivation) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Tous les champs obligatoires doivent être remplis.']);
        exit;
    }
    if (strlen($description) < 20) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'La description doit contenir au moins 20 caractères.']);
        exit;
    }
    if (strlen($motivation) < 20) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'La motivation doit contenir au moins 20 caractères.']);
        exit;
    }

    // Si une ancienne demande existe, on la reutilise au lieu de creer un doublon.
    if ($existing) {
        $stmt = $pdo->prepare(
            'UPDATE demandes_vendeur
             SET nom_boutique=?, description=?, categories=?, experience=?, site_web=?, telephone=?, motivation=?, etat="en_attente"
             WHERE user_id=?'
        );
        $stmt->execute([$nom_boutique, $description, $categories, $experience, $site_web, $telephone, $motivation, $user['id']]);
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO demandes_vendeur (user_id, nom_boutique, description, categories, experience, site_web, telephone, motivation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$user['id'], $nom_boutique, $description, $categories, $experience, $site_web, $telephone, $motivation]);
    }

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Demande envoyée. Un modérateur examinera votre dossier.']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
