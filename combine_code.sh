#!/bin/bash
output_file="/tmp/all_project_code.txt"
echo "" > $output_file
find . -name "*.ts" | sort | while read -r file; do
  echo -e "\n\n--- File: $file ---\n" >> $output_file
  cat "$file" >> $output_file
done
