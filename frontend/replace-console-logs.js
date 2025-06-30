#!/usr/bin/env node

/**
 * Script pour remplacer automatiquement les console.log/error par le système de logging
 * Usage: node replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns à remplacer
const replacements = [
  // Console.error patterns
  {
    pattern: /console\.error\(['"`]([^'"`]+)['"`],?\s*([^)]*)\);?/g,
    replacement: (match, message, context) => {
      const cleanContext = context.trim();
      if (cleanContext) {
        return `log.error('${message}', ${cleanContext}, 'COMPONENT_NAME');`;
      }
      return `log.error('${message}', undefined, 'COMPONENT_NAME');`;
    }
  },
  // Console.log patterns
  {
    pattern: /console\.log\(['"`]([^'"`]+)['"`],?\s*([^)]*)\);?/g,
    replacement: (match, message, context) => {
      const cleanContext = context.trim();
      if (cleanContext) {
        return `log.debug('${message}', ${cleanContext}, 'COMPONENT_NAME');`;
      }
      return `log.debug('${message}', undefined, 'COMPONENT_NAME');`;
    }
  }
];

// Fonction pour obtenir le nom du composant depuis le chemin de fichier
function getComponentName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename.charAt(0).toUpperCase() + basename.slice(1);
}

// Fonction pour ajouter l'import si nécessaire
function ensureLoggerImport(content) {
  if (!content.includes("import { log }") && !content.includes("from '../services/logger'")) {
    // Trouver où insérer l'import
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    if (importLines.length > 0) {
      const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
      const insertPosition = content.indexOf('\n', lastImportIndex) + 1;
      
      const newImport = "import { log } from '../services/logger';\n";
      content = content.slice(0, insertPosition) + newImport + content.slice(insertPosition);
    }
  }
  return content;
}

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const componentName = getComponentName(filePath);
    
    // Appliquer les remplacements
    replacements.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, (match, ...args) => {
        const result = replacement(match, ...args);
        return result.replace('COMPONENT_NAME', componentName);
      });
      
      if (newContent !== content) {
        modified = true;
        content = newContent;
      }
    });
    
    // Ajouter l'import si des changements ont été faits
    if (modified && (content.includes('log.error') || content.includes('log.debug'))) {
      content = ensureLoggerImport(content);
    }
    
    // Écrire le fichier si modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Fonction principale
function main() {
  const srcDir = path.join(__dirname, 'src');
  const pattern = path.join(srcDir, '**/*.{ts,tsx}').replace(/\\/g, '/');
  
  console.log('🔍 Searching for TypeScript files...');
  
  // Exclure les fichiers de test et le logger lui-même
  const files = glob.sync(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/logger.ts',
      '**/notifications.ts'
    ]
  });
  
  console.log(`📁 Found ${files.length} files to process`);
  
  let processedCount = 0;
  files.forEach(file => {
    if (processFile(file)) {
      processedCount++;
    }
  });
  
  console.log(`🎉 Processing complete! Modified ${processedCount} files.`);
}

// Lancer le script
if (require.main === module) {
  main();
}

module.exports = { processFile, getComponentName };
