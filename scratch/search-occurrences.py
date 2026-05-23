import os

def search_text_in_files(directory, search_text):
    results = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.jsx', '.json', '.html', '.css')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            if search_text in line:
                                results.append((file_path, i + 1, line.strip()))
                except Exception as e:
                    pass
    return results

# Search for time_minutes
occ_time_minutes = search_text_in_files('src', 'time_minutes')
print(f"Found {len(occ_time_minutes)} occurrences of 'time_minutes':")
for file_path, line_num, line in occ_time_minutes:
    print(f"  {file_path}:{line_num} -> {line}")

# Search for total_time_min
occ_total_time_min = search_text_in_files('src', 'total_time_min')
print(f"\nFound {len(occ_total_time_min)} occurrences of 'total_time_min':")
for file_path, line_num, line in occ_total_time_min:
    print(f"  {file_path}:{line_num} -> {line}")
