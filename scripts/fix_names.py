import json

with open('database/seed/moyen_family_data.json', 'r') as f:
    data = json.load(f)

fixes = {
    'fuppi-katihar':          ('Fuppi Katihar',        'Molla'),
    'fuppi-katihar-husband':  ("Fuppi Katihar'r Bor",  ''),
    'fuppi-debipur':          ('Fuppi Debipur',         'Molla'),
    'fuppi-debipur-husband':  ("Fuppi Debipur'r Bor",   ''),
    'fuppi-pagha':            ('Fuppi Pagha',            'Molla'),
    'fuppi-pagha-husband':    ("Fuppi Pagha'r Bor",     ''),
    'mota-husband':           ("Mota'r Bor",            ''),
    'mono-husband':           ("Mono'r Bor",            ''),
    'alom-wife':              ("Alom'r Bou",            ''),
    'lily-husband':           ("Lily'r Bor",            ''),
    'chumki':                 ('Chumki',                 'Molla'),
    'chumki-sotobon':         ('Chumki Sotobon',         'Molla'),
    'masum':                  ('Masum',                  'Molla'),
    'masud':                  ('Masud',                  'Molla'),
    'masuma':                 ('Masuma',                 'Molla'),
    'lily-meye':              ('Lily Meye',              'Molla'),
    'lily-sele':              ('Lily Sele',              'Molla'),
    'sultana-meye':           ('Sultana Meye',           'Molla'),
    'zahurul-sele':           ('Zahurul Sele',           'Islam'),
    'zahurul-meye':           ('Zahurul Meye',           'Islam'),
    'pochi-husband':          ("Pochi'r Bor",           ''),
    'pochi-meye':             ('Pochi Meye',             'Molla'),
    'shahin':                 ('Shahin',                 'Molla'),
    'shahin-soto':            ('Shahin Soto',            'Molla'),
    'zobbar':                 ('Zobbar',                 ''),
    'zossna-second-husband':  ("Zossna'r Dwitio Bor",   ''),
    'akhi-husband':           ("Akhi'r Bor",            ''),
    'rony':                   ('Rony',                   ''),
    'rina-husband':           ("Rina'r Bor",            ''),
    'akter-husband':          ("Aktar'r Bor",           ''),
    'shiuly-husband':         ("Shiuly'r Bor",          ''),
    'rinna-meye':             ('Rinna Meye',             'Begum'),
    'akter-meye1':            ('Akter Meye 1',           'Begum'),
    'akter-meye2':            ('Akter Meye 2',           'Begum'),
    'shiuly-sele':            ('Shiuly Sele',            'Molla'),
    'sweet-sele':             ('Sweet Sele',             'Molla'),
    'saikat':                 ('Saikat',                 'Molla'),
    'shihab':                 ('Shihab',                 'Molla'),
    'apon':                   ('Apon',                   'Molla'),
    'mominul-meye':           ('Mominul Meye',           'Molla'),
    'rehena-meye1':           ('Rehena Meye 1',          'Begum'),
    'rehena-meye2':           ('Rehena Meye 2',          'Begum'),
    'rehena-sele1':           ('Rehena Sele 1',          'Molla'),
    'chumki-soto-meye':       ('Chumki Soto Meye',       'Molla'),
    'rayhan':                 ('Rayhan',                  ''),
}

changed = 0
for person in data['persons']:
    pid = person.get('id', '')
    if pid in fixes:
        fn, ln = fixes[pid]
        person['firstName'] = fn
        person['lastName']  = ln
        changed += 1
        print(f'  Fixed: {pid}  ->  {fn} {ln}')

print(f'\nTotal changed: {changed}')

with open('database/seed/moyen_family_data.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Saved.')

