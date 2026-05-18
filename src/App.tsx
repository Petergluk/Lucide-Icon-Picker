import { useState, useMemo, useEffect, createElement } from 'react';
import * as LucideIcons from 'lucide-react';
import { createLucideIcon } from 'lucide-react';
import { Search, Copy, Download, Check, Filter, Beaker } from 'lucide-react';
import * as LucideLab from '@lucide/lab';
import { CATEGORIES } from './categories';

// Convert PascalCase to kebab-case for the HTML export
const toKebabCase = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

// Get standard icon names
const standardIconNames = Object.keys((LucideIcons as any).icons).sort();

// Collect lab icons
// @lucide/lab exports the icon nodes in camelCase. We'll convert to PascalCase.
const labIconEntries = Object.entries(LucideLab)
  .filter(([name]) => name !== 'default' && name !== 'lucideLab')
  .map(([name, node]) => {
    // Convert camelCase to PascalCase
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    const Component = createLucideIcon(pascalName, node as any);
    return { name: pascalName, component: Component, isLab: true };
  });

const labIconNames = labIconEntries.map(e => e.name).sort();

// Create a component registry for fast lookup
const componentRegistry: Record<string, any> = {};
for (const name of standardIconNames) {
  componentRegistry[name] = (LucideIcons as any)[name];
}
for (const { name, component } of labIconEntries) {
  componentRegistry[name] = component;
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showLabIcons, setShowLabIcons] = useState(false);
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const filteredIcons = useMemo(() => {
    // Deduplicate the combined list to prevent double icons (e.g., if CardSim is in standard AND lab)
    let result = showLabIcons ? Array.from(new Set([...standardIconNames, ...labIconNames])).sort() : standardIconNames;
    
    // Apply category filter
    if (activeCategory === 'Lucide Lab') {
      result = labIconNames; // Only lab icons when "Lucide Lab" category is active
    } else if (activeCategory !== 'All') {
      const categoryIcons = new Set(CATEGORIES[activeCategory as keyof typeof CATEGORIES] || []);
      // Filter exactly by category map
      result = result.filter(name => categoryIcons.has(name));
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return result;
  }, [searchTerm, activeCategory, showLabIcons]);

  const toggleIcon = (name: string) => {
    const newSelected = new Set(selectedIcons);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedIcons(newSelected);
  };

  const copyToClipboard = () => {
    const namesArray = Array.from(selectedIcons);
    // Copy as comma-separated values as requested by the user
    const textToCopy = namesArray.join(', ');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportHtml = () => {
    const namesArray = Array.from(selectedIcons);
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selected Lucide Icons</title>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      background: #f9fafb;
    }
    .header {
      margin-bottom: 2rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 1.5rem;
    }
    .icon-card {
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .icon-name {
      font-size: 0.875rem;
      color: #4b5563;
      text-align: center;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Selected Icons (${namesArray.length})</h1>
  </div>
  <div class="grid">
    ${namesArray.map((name: any) => `
    <div class="icon-card">
      <i data-lucide="${toKebabCase(name as string)}"></i>
      <span class="icon-name">${name}</span>
    </div>`).join('\n')}
  </div>
  <script>
    lucide.createIcons();
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lucide-icons-collection.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pagination for performance (infinite scroll)
  const [displayCount, setDisplayCount] = useState(150);
  
  useEffect(() => {
    const handleScroll = () => {
      // Load more when scrolled near the bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 800) {
        setDisplayCount(prev => Math.min(prev + 150, filteredIcons.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredIcons.length]);

  // Reset display count on new search or category change
  useEffect(() => {
    setDisplayCount(150);
  }, [searchTerm, activeCategory, showLabIcons]);

  const displayedIcons = filteredIcons.slice(0, displayCount);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
            <LucideIcons.Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Lucide Picker</h1>
            <p className="text-xs text-gray-500 font-medium">{filteredIcons.length} icons available</p>
          </div>
        </div>
        
        <div className="relative flex-1 max-w-xl w-full flex bg-gray-100 rounded-xl focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 border border-transparent transition-all">
          <div className="relative flex items-center border-r border-gray-200">
            <Filter className="absolute left-3 w-4 h-4 text-gray-500 pointer-events-none" />
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-transparent text-sm font-medium text-gray-700 outline-none appearance-none cursor-pointer hover:text-indigo-600 transition-colors w-full sm:w-auto"
            >
              {['All', 'Lucide Lab', ...Object.keys(CATEGORIES).filter(c => c !== 'All').sort()]
                .map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="absolute right-2 pointer-events-none text-gray-500">
              <LucideIcons.ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search icons..." 
              className="w-full pl-9 pr-4 py-2.5 bg-transparent outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg mr-2 whitespace-nowrap">
                    {selectedIcons.size} selected
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mr-2">
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${showLabIcons ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={showLabIcons}
                        onChange={(e) => setShowLabIcons(e.target.checked)}
                      />
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showLabIcons ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Beaker className="w-4 h-4 text-gray-500" />
                      Lab
                    </span>
                  </label>
                  <button
            onClick={copyToClipboard}
            disabled={selectedIcons.size === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy JSX'}
          </button>
          <button 
            onClick={exportHtml}
            disabled={selectedIcons.size === 0}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export HTML
          </button>
        </div>
      </header>

      <main className="p-6 max-w-screen-2xl mx-auto">
        {filteredIcons.length === 0 ? (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No icons found</h3>
            <p className="text-gray-500 mt-1">We couldn't find anything matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {displayedIcons.map(name => {
              const IconComponent = componentRegistry[name];
              const isSelected = selectedIcons.has(name);
              const isLab = labIconNames.includes(name);
              
              if (!IconComponent) return null;

              return (
                <button
                  key={name}
                  onClick={() => toggleIcon(name)}
                  className={`group relative flex flex-col items-center justify-center p-4 gap-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-indigo-500 shadow-md bg-indigo-50/50 ring-1 ring-indigo-500' 
                      : isLab
                        ? 'bg-purple-50/30 border-purple-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  title={name}
                >
                  {isLab && (
                    <div className="absolute top-2 right-2 text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity" title="Lucide Lab Icon">
                      <Beaker className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <IconComponent 
                    className={`w-8 h-8 transition-transform group-hover:scale-110 ${isSelected ? 'text-indigo-600' : 'text-gray-600 group-hover:text-gray-900'}`} 
                    strokeWidth={isSelected ? 2.5 : 2} 
                  />
                  <span className={`text-xs truncate w-full text-center max-w-[80px] font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-500 group-hover:text-gray-700'}`} title={name}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <footer className="mt-16 pb-8 text-center text-sm text-gray-500">
        <p>
          Icons provided by <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium">Lucide</a> and <a href="https://github.com/lucide-icons/lucide-lab" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium">Lucide Lab</a>.
        </p>
      </footer>
    </div>
  );
}
