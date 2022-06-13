import { ApiRef, IContribution, PackageJson, ThemeMap } from './common';

export interface ICommandDescriptor {
  /**
   * Unique command ID.
   */
  id: string;

  /**
   * Human-readable command title.
   */
  title: string;

  /**
   * Whether the invokation of this command should activate the extension,
   * defaults to true if not provided.
   */
  activates?: boolean;

  /**
   * Category of the command, shown as a prefix.
   */
  category?: string;

  /**
   * Either an icon to use, or a mapping of different icons for
   * different themes.
   */
  icon?: string | ThemeMap<string>;
}

export class ExternalCommand<TArgs extends unknown[], TReturnType> {
  constructor(protected readonly api: ApiRef, private readonly id: string) {}

  /**
   * Calls the external command.
   *
   * ```ts
   * const open = contributions.externalCommand<[Uri]>('vscode.open')();
   * await open.call(fileUri);
   * ```
   */
  public async call(...args: TArgs): Promise<TReturnType> {
    return await this.api.get().commands.executeCommand<TReturnType>(this.id, ...args);
  }
}

export class Command<TArgs extends unknown[], TReturnType>
  extends ExternalCommand<TArgs, TReturnType>
  implements IContribution
{
  public isRegistered = false;

  constructor(api: ApiRef, public readonly descriptor: ICommandDescriptor) {
    super(api, descriptor.id);
  }

  /**
   * Registers a command that can be called.
   * ```ts
   * const greet = contributions.externalCommand<[string]>('sendGreeting')();
   *
   * context.subscriptions.push(
   *   greet.register(name => console.log(`hello ${name}`)),
   * );
   * ```
   */
  public async register(fn: (...args: TArgs) => TReturnType | Promise<TReturnType>) {
    this.isRegistered = true;
    return this.api.get().commands.registerCommand(this.descriptor.id, fn);
  }

  public override toString() {
    return `Command(${this.descriptor.id})`;
  }

  /** @inheritdoc */
  public contribute({ activationEvents, contributions }: PackageJson): void {
    contributions.commands ??= [];
    contributions.commands.push({
      command: this.descriptor.id,
      category: this.descriptor.category,
      icon: this.descriptor.icon,
      title: this.descriptor.title,
    });

    if (this.descriptor.activates !== false) {
      activationEvents.add(`onCommand:${this.descriptor.id}`);
    }
  }
}
