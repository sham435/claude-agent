import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import PptxGenJS from 'pptxgenjs';

interface SlideContent {
  title: string;
  bullets: string[];
}

export interface PptGenerationResult {
  success: boolean;
  url?: string;
  fileName?: string;
  slidesCount?: number;
  headings?: string[];
  imagesCount?: number;
  message?: string;
}

@Injectable()
export class PdfPptService {
  private outputsDir: string;

  constructor() {
    this.outputsDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(this.outputsDir)) {
      fs.mkdirSync(this.outputsDir, { recursive: true });
    }
  }

  async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    return '';
  }

  parseTextToSlides(text: string): SlideContent[] {
    const lines = text.split('\n').filter(line => line.trim());
    const slides: SlideContent[] = [];
    let currentSlide: SlideContent = { title: 'Overview', bullets: [] };

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.length < 100 && (
        trimmed.endsWith(':') || 
        trimmed.match(/^[A-Z][A-Za-z\s]{5,50}$/) ||
        trimmed.match(/^Section \d+:/)
      )) {
        if (currentSlide.bullets.length > 0 || currentSlide.title !== 'Overview') {
          slides.push(currentSlide);
        }
        currentSlide = { title: trimmed.replace(/:$/, ''), bullets: [] };
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        currentSlide.bullets.push(trimmed.substring(2));
      } else if (trimmed.length > 10) {
        if (currentSlide.bullets.length < 6) {
          currentSlide.bullets.push(trimmed);
        }
      }
    }

    if (currentSlide.bullets.length > 0 || currentSlide.title !== 'Overview') {
      slides.push(currentSlide);
    }

    if (slides.length === 0) {
      slides.push({ title: 'Content', bullets: text.split('\n').filter(l => l.trim()).slice(0, 10) });
    }

    return slides;
  }

  async generatePpt(
    content: string, 
    title: string, 
    template: string = 'TITLE_AND_CONTENT'
  ): Promise<PptGenerationResult> {
    try {
      const slidesData = this.parseTextToSlides(content);
      const pptx = new PptxGenJS();

      const templateStyles: Record<string, any> = {
        TITLE_AND_CONTENT: { titleFontSize: 32, titleColor: '363636', bodyFontSize: 18 },
        SECTION: { titleFontSize: 28, titleColor: '1a73e8', bodyFontSize: 16, bgColor: 'f8f9fa' },
        IMAGE_HEADY: { titleFontSize: 24, titleColor: '202124', bodyFontSize: 14 },
        BLANK: { titleFontSize: 20, titleColor: '000000', bodyFontSize: 12 },
      };

      const style = templateStyles[template] || templateStyles.TITLE_AND_CONTENT;

      for (let i = 0; i < slidesData.length; i++) {
        const slide = pptx.addSlide();
        const slideData = slidesData[i];

        if (template !== 'BLANK') {
          slide.addText(slideData.title, {
            x: 0.5,
            y: 0.4,
            w: 9,
            h: 0.8,
            fontSize: style.titleFontSize,
            fontFace: 'Arial',
            color: style.titleColor,
            bold: true,
          });
        }

        if (slideData.bullets.length > 0) {
          slide.addText(slideData.bullets.map(b => ({ text: b, options: { bullet: true } })), {
            x: 0.5,
            y: template !== 'BLANK' ? 1.5 : 0.5,
            w: 9,
            h: 4,
            fontSize: style.bodyFontSize,
            fontFace: 'Arial',
            color: '363636',
            valign: 'top',
          });
        }

        if (style.bgColor) {
          slide.background = { color: style.bgColor };
        }
      }

      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pptx`;
      const filePath = path.join(this.outputsDir, fileName);

      await pptx.writeFile({ fileName: filePath });

      return {
        success: true,
        url: `/outputs/${fileName}`,
        fileName,
        slidesCount: slidesData.length,
        headings: slidesData.map(s => s.title),
        imagesCount: 0,
      };
    } catch (err) {
      console.error('[PPT] Generation error:', err);
      return {
        success: false,
        message: `PPT generation failed: ${err.message}`,
      };
    }
  }

  getOutputsDir(): string {
    return this.outputsDir;
  }
}
