import {
  CancellationToken,
  Disposable,
  DocumentFormattingEditProvider,
  DocumentRangeFormattingEditProvider,
  FormattingOptions,
  OutputChannel,
  ProviderResult,
  Range,
  TextDocument,
  TextEdit,
  window,
} from 'coc.nvim';
import { PythonSettings } from '../configSettings';
import { FormatterId } from '../types';
import { AutoPep8Formatter } from './formatters/autopep8';
import { BaseFormatter } from './formatters/baseFormatter';
import { BlackFormatter } from './formatters/black';
import { BlackdFormatter } from './formatters/blackd';
import { DarkerFormatter } from './formatters/darker';
import { PyinkFormatter } from './formatters/pyink';
import { YapfFormatter } from './formatters/yapf';

export class PythonFormattingEditProvider implements DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider {
  private formatters = new Map<FormatterId, BaseFormatter>();
  private disposables: Disposable[] = [];
  private pythonSettings: PythonSettings;
  private outputChannel: OutputChannel;

  constructor() {
    this.pythonSettings = PythonSettings.getInstance();
    this.outputChannel = window.createOutputChannel('coc-pyright-formatting');

    const provider = this.pythonSettings.formatting.provider;
    switch (provider) {
      case 'black':
        this.formatters.set('black', new BlackFormatter(this.pythonSettings, this.outputChannel));
        break;
      case 'pyink':
        this.formatters.set('pyink', new PyinkFormatter(this.pythonSettings, this.outputChannel));
        break;
      case 'blackd':
        this.formatters.set('blackd', new BlackdFormatter(this.pythonSettings, this.outputChannel));
        break;
      case 'yapf':
        this.formatters.set('yapf', new YapfFormatter(this.pythonSettings, this.outputChannel));
        break;
      case 'autopep8':
        this.formatters.set('autopep8', new AutoPep8Formatter(this.pythonSettings, this.outputChannel));
        break;
      case 'darker':
        this.formatters.set('darker', new DarkerFormatter(this.pythonSettings, this.outputChannel));
        break;
      default:
        break;
    }
  }

  private async _provideEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken, range?: Range): Promise<TextEdit[]> {
    const provider = this.pythonSettings.formatting.provider;
    const formatter = this.formatters.get(provider);
    if (!formatter) {
      this.outputChannel.appendLine(`${'#'.repeat(10)} Error: python.formatting.provider is ${provider}, which is not supported`);
      return [];
    }

    this.outputChannel.appendLine(`Using python from ${this.pythonSettings.pythonPath}\n`);
    this.outputChannel.appendLine(`${'#'.repeat(10)} active formattor: ${formatter.Id}`);
    return formatter.formatDocument(document, options, token, range);
  }

  provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
    return this._provideEdits(document, options, token);
  }

  provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
    return this._provideEdits(document, options, token, range);
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
