<?php

/**
 * Package validation script
 * 
 * This script validates that the PHP SDK package is properly structured
 * for Packagist distribution and follows PSR standards.
 */

echo "🔍 Validating Tannur PHP SDK Package Structure\n\n";

$errors = [];
$warnings = [];

// Check required files
$requiredFiles = [
    'composer.json' => 'Composer configuration',
    'README.md' => 'Package documentation',
    'LICENSE' => 'License file',
    'CHANGELOG.md' => 'Version history',
    'src/TannurClient.php' => 'Main client class',
    'src/TannurException.php' => 'Exception class',
    'src/TannurConfig.php' => 'Configuration class',
    'src/Tannur.php' => 'Factory class',
];

foreach ($requiredFiles as $file => $description) {
    if (file_exists($file)) {
        echo "✅ {$description}: {$file}\n";
    } else {
        $errors[] = "Missing {$description}: {$file}";
        echo "❌ Missing {$description}: {$file}\n";
    }
}

// Check composer.json structure
if (file_exists('composer.json')) {
    $composer = json_decode(file_get_contents('composer.json'), true);
    
    $requiredComposerFields = [
        'name' => 'Package name',
        'description' => 'Package description',
        'license' => 'License',
        'authors' => 'Authors',
        'require' => 'Dependencies',
        'autoload' => 'Autoloading configuration',
    ];
    
    echo "\n📦 Composer.json validation:\n";
    foreach ($requiredComposerFields as $field => $description) {
        if (isset($composer[$field])) {
            echo "✅ {$description}\n";
        } else {
            $errors[] = "Missing composer.json field: {$field}";
            echo "❌ Missing {$description}\n";
        }
    }
    
    // Check PSR-4 autoloading
    if (isset($composer['autoload']['psr-4']['Tannur\\SDK\\'])) {
        echo "✅ PSR-4 autoloading configured\n";
    } else {
        $errors[] = "PSR-4 autoloading not properly configured";
        echo "❌ PSR-4 autoloading not properly configured\n";
    }
}

// Check PHP syntax
echo "\n🔧 PHP syntax validation:\n";
$phpFiles = glob('src/*.php');
foreach ($phpFiles as $file) {
    $output = [];
    $returnCode = 0;
    exec("php -l {$file} 2>&1", $output, $returnCode);
    
    if ($returnCode === 0) {
        echo "✅ {$file}\n";
    } else {
        $errors[] = "Syntax error in {$file}: " . implode(' ', $output);
        echo "❌ Syntax error in {$file}\n";
    }
}

// Check class structure
echo "\n🏗️  Class structure validation:\n";
$classes = [
    'Tannur\\SDK\\TannurClient' => 'src/TannurClient.php',
    'Tannur\\SDK\\TannurException' => 'src/TannurException.php',
    'Tannur\\SDK\\TannurConfig' => 'src/TannurConfig.php',
    'Tannur\\SDK\\Tannur' => 'src/Tannur.php',
];

foreach ($classes as $className => $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (strpos($content, "class " . basename($className)) !== false) {
            echo "✅ {$className}\n";
        } else {
            $warnings[] = "Class {$className} not found in {$file}";
            echo "⚠️  Class {$className} not found in {$file}\n";
        }
    }
}

// Summary
echo "\n📊 Validation Summary:\n";
if (empty($errors)) {
    echo "✅ Package structure is valid!\n";
} else {
    echo "❌ Found " . count($errors) . " error(s):\n";
    foreach ($errors as $error) {
        echo "   • {$error}\n";
    }
}

if (!empty($warnings)) {
    echo "⚠️  Found " . count($warnings) . " warning(s):\n";
    foreach ($warnings as $warning) {
        echo "   • {$warning}\n";
    }
}

echo "\n🚀 Ready for Packagist submission: " . (empty($errors) ? "YES" : "NO") . "\n";

exit(empty($errors) ? 0 : 1);