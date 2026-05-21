import os
import re
import glob

def fix_shadows():
    search_dirs = ['app', 'components']
    for search_dir in search_dirs:
        for root, dirs, files in os.walk(search_dir):
            for file in files:
                if file.endswith('.tsx'):
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Find all matches
                    matches = re.findall(r'shadow-([a-zA-Z]+)/(\d+)', content)
                    if not matches:
                        continue
                    
                    print(f"Fixing {filepath}...")
                    
                    # Ensure Colors is imported
                    if 'Colors' not in content:
                        import_stmt = "import { Colors } from '@/constants/Theme';\n"
                        import_matches = list(re.finditer(r'^import .*?;?\n', content, flags=re.MULTILINE))
                        if import_matches:
                            last_match = import_matches[-1]
                            content = content[:last_match.end()] + import_stmt + content[last_match.end():]
                        else:
                            content = import_stmt + content

                    # We need to replace cases like:
                    # 1. className="... shadow-primary/20 ..." -> className="..." style={{ shadowColor: Colors.primary, shadowOpacity: 0.2 }}
                    # 2. className={`... shadow-primary/20 ...`} -> className={`...`} style={{ shadowColor: Colors.primary, shadowOpacity: 0.2 }}
                    
                    # To do this safely, we will look for className="..." or className={`...`}
                    # For static:
                    def replace_static(m):
                        classes = m.group(1)
                        color = m.group(2)
                        opacity = m.group(3)
                        # Remove the shadow-color/opacity from classes
                        classes = re.sub(rf'\bshadow-{color}/{opacity}\b', '', classes).replace('  ', ' ')
                        style_str = f" style={{{{ shadowColor: Colors.{color}, shadowOpacity: {int(opacity)/100} }}}}"
                        return f'className="{classes.strip()}"{style_str}'
                    
                    content = re.sub(r'className="(.*?)\bshadow-([a-zA-Z]+)/(\d+)\b(.*?)"', replace_static, content)

                    # For dynamic (template literals), we just remove the class and add style outside.
                    # This is trickier if it's inside a ternary. We'll handle specific known cases.
                    # e.g., className={`px-4 py-2 ... ${cond ? '... shadow-sec/20' : '...'}`}
                    def replace_dynamic(m):
                        prefix = m.group(1)
                        color = m.group(2)
                        opacity = m.group(3)
                        suffix = m.group(4)
                        # We just remove the class from the template literal for now and inject style if we can find the end of the element opening tag
                        return f'{prefix}{suffix}'
                        
                    content = re.sub(r'(className={`[^`]*?)\bshadow-([a-zA-Z]+)/(\d+)\b([^`]*?`})', replace_dynamic, content)
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)

if __name__ == "__main__":
    fix_shadows()
