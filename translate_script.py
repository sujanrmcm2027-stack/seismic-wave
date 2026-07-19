import re
import os

file_path = "src/routes/index.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Helper function to wrap with T component
def wrap_t(en_str, ne_str):
    return f'<T en="{en_str}" ne="{ne_str}" />'

# Section 01b
content = content.replace(
    '<SectionLabel number="01b" label="MECHANISM" />',
    '<SectionLabel number="01b" label={<T en="MECHANISM" ne="प्रक्रिया" />} />'
)
content = content.replace(
    'How Do Earthquakes Occur?',
    '<T en="How Do Earthquakes Occur?" ne="भूकम्प कसरी जान्छ?" />'
)
content = content.replace(
    'From slow plate drift to sudden rupture, four stages explain the cycle of seismic\n          energy.',
    '<T en="From slow plate drift to sudden rupture, four stages explain the cycle of seismic energy." ne="प्लेटहरूको सुस्त गतिदेखि अचानक फुट्ने प्रक्रियासम्म, यी चार चरणहरूले भूकम्पीय ऊर्जाको चक्रलाई प्रस्ट पार्छन्।" />'
)

# Section 01c
content = content.replace(
    '<SectionLabel number="01c" label="NEPAL\'S GEOLOGY" />',
    '<SectionLabel number="01c" label={<T en="NEPAL\'S GEOLOGY" ne="नेपालको भौगर्भिक अवस्था" />} />'
)
content = content.replace(
    'Why Does Nepal Experience Frequent Earthquakes?',
    '<T en="Why Does Nepal Experience Frequent Earthquakes?" ne="नेपालमा किन बारम्बार भूकम्प जान्छ?" />'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Translation script applied successfully.")
