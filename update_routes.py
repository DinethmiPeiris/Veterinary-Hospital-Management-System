import os
import glob

# Backend files
files = glob.glob('backend/src/main/java/com/vhms/vhms/controller/**/*.java', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Replace @RequestMapping("/api/epic3/...") with @RequestMapping("/api/v1/...")
    content = content.replace('@RequestMapping("/api/epic3/', '@RequestMapping("/api/v1/')
    
    # Replace @RequestMapping("/api/legacy/...") with @RequestMapping("/api/v1/...")
    content = content.replace('@RequestMapping("/api/legacy/appointments")', '@RequestMapping("/api/v1/legacy/appointments")')
    
    # For others like @RequestMapping("/api/appointments") -> @RequestMapping("/api/v1/appointments")
    # But only if it's not already /api/v1/
    # We can just replace @RequestMapping("/api/ with @RequestMapping("/api/v1/ if it's not followed by v1/
    import re
    content = re.sub(r'@RequestMapping\("/api/(?!v1/)', '@RequestMapping("/api/v1/', content)
    
    with open(file, 'w') as f:
        f.write(content)

print("Updated backend routes")
