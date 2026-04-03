export interface LibraryItem {
  slug: string;
  title: string;
  content: string;
}

export interface LibrarySection {
  slug: string;
  title: string;
  description: string;
  icon: string;
  items: LibraryItem[];
}

export const librarySections: LibrarySection[] = [
    {
        slug: 'akademik-makaleler',
        title: "Akademik Makaleler",
        description: "Üniversiteler ve araştırma kurumları tarafından hazırlanan akademik çalışmalar.",
        icon: "GraduationCap",
        items: []
    },
    {
        slug: 'hangel-sozlugu',
        title: "Hangel Sözlüğü",
        description: "Hangel platformunda kullanılan terimlerin ve kavramların açıklamaları.",
        icon: "BookMarked",
        items: []
    },
    {
        slug: 'sivil-toplum-sozlugu',
        title: "Sivil Toplum Sözlüğü",
        description: "Sivil toplum alanında sıkça kullanılan terimlerin açıklamaları.",
        icon: "BookOpen",
        items: []
    }
];
