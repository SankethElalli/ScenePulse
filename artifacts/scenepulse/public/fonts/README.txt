Place the licensed Champ (Sharp Type) font files here to activate them.

Expected filenames:
  Champ-Regular.woff2   (weight 400)
  Champ-Medium.woff2    (weight 500)
  Champ-SemiBold.woff2  (weight 600)
  Champ-Bold.woff2      (weight 700)

If you only have .otf/.ttf files, convert them to .woff2 (e.g. with fonttools
or an online converter) and use the names above.

Then add these @font-face rules to the top of src/index.css (right after the
@plugin lines). "Champ" is already first in the --app-font-sans stack, so the
app will switch over automatically once these are present:

  @font-face { font-family:"Champ"; font-weight:400; font-display:swap; src:url("/fonts/Champ-Regular.woff2") format("woff2"); }
  @font-face { font-family:"Champ"; font-weight:500; font-display:swap; src:url("/fonts/Champ-Medium.woff2") format("woff2"); }
  @font-face { font-family:"Champ"; font-weight:600; font-display:swap; src:url("/fonts/Champ-SemiBold.woff2") format("woff2"); }
  @font-face { font-family:"Champ"; font-weight:700; font-display:swap; src:url("/fonts/Champ-Bold.woff2") format("woff2"); }

Until Champ is added, the app falls back to Space Grotesk, then Inter.
