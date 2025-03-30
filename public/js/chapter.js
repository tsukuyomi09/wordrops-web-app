const toolbarOptions = [
    ['bold', 'italic', 'underline'],     
    [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
    [{ 'align': [] }],                     
    [{ 'header': '1' }, { 'header': '2' }],
    [{ 'size': ['small', 'medium', 'large', 'huge'] }],
    ['clean']                           
  ];
  
  // Inizializza Quill
  const editor = new Quill('#editor-container', {
    theme: 'snow',                         // Tema 'snow'
    modules: {
      toolbar: toolbarOptions              // Usa la barra degli strumenti configurata
    },
  });

const toolbar = document.querySelector('.ql-toolbar');
toolbar.classList.add('rounded', 'mb-4', 'text-2xl')


function getChapter() {
    const savedContent = localStorage.getItem('chapterContent'); // Ottieni il contenuto salvato
    if (savedContent) {
      editor.root.innerHTML = savedContent; // Carica il contenuto nell'editor
    }
};

editor.on('text-change', function() {
    const content = editor.root.innerHTML;
    localStorage.setItem('chapterContent', content); // Salva il contenuto nell'localStorage
});

getChapter()

