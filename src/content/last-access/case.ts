import type { CaseContent } from '../../game/types';
import { files } from './files';
import { conversations } from './conversations';
import { calendar } from './calendar';
import { puzzles,hints } from './puzzles';
import { evidence } from './evidence';
import { questions } from './solution';
export const lastAccessCase:CaseContent={id:'last-access',version:1,referenceTime:'2026-10-18 20:45',files,conversations,calendar,puzzles,evidence,questions,hints,assets:{'first-exhibition':new URL('./assets/first-exhibition.svg',import.meta.url).href,'annex-map':new URL('./assets/annex-map.svg',import.meta.url).href}};
