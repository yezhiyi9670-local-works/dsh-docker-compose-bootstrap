The root of this workspace is READ ONLY regardless of current permission profile. Folders under the workspace root are actual projects or temporary locations. See below.

## Project folders

Directories other than `tmpfs` and `shared_temp` in the current workspace are project folders. Project folders should only contain files that are by convention expected to belong in them. You may read any project folder under your workspace to gain extra information, but do NOT write to a project folder unless instructed to.

If a project folder appears as a read-only tmpfs or fails with "no such file or directory" when itself is being accessed (despite the folder itself being existent), it means that a detected problem on the host has rendered the project folder unable be properly mounted at all, possibly due to the portable storage device containing the project is absent. Stop and report the problem to the user immediately if you have to use such project folder.

A special project folder named `shared_docs` may or may not exist. When it exists, it is a mirror of a Harness-wide shared directory. It is mainly intended for communicating cross-session workspace-agnostic documentation such as user persona and code style preferences. You are expected to consult this directory for general workspace-agnostic advices. Do NOT write into this project folder without explicit user consent. Do NOT put any disposable file here (consider `./shared_temp` instead, see below).

## Temporary locations

The following three locations can be used to store temporary files:

| Location | Type | Lifespan | When to use |
| - | - | - | - |
| `/tmp` | tmpfs | Available to shell commands only.<br/>Private per command call. | The command-line tool you use just need a valid OS temp dir. You don't care whether the temp files persist or not. |
| `./tmpfs` | tmpfs | Private per workspace.<br/>Does not survive DSH restarts. | You need to store temporary files that are not meant to be persistent, but must be available across tool calls and/or be accessible with non-shell tools.<br/>Only writable when permission preset is not `read_only`. |
| `./shared_temp` | bind | Mirror of a temporary dir shared across entire DSH.<br/>Persistent. | You need to store persistent files that does not properly belong in project folders, for example, toolchains that you will always need but the environment does not offer by itself.<br/>Only writable when permission preset is not `read_only`.<br/>Files here still considered disposable in the long run, which means no external version control or backup. |

If a certain one of the three above does not exist, DO NOT create directories with these names and assume that the newly created directories have the properties described above. Any directories you created manually are just regular directories, not special mount points.

If a certain kind of temporary directory you need is missing, pause your job and alert the user about it, unless explicitly told otherwise. If you are told to continue anyways by writing temporary files in project folders, you are responsible for cleaning up files that do not properly belong in the project folders after your job has completed, unless believing that you should not or told not to.

Since `./shared_temp` is persistent and shared Harness-wide, organize the files in it wisely to avoid confusing other Agent sessions (which may not have your current context and memories) and resulting "race conditions" between sessions.

Files that are meant to be delivered to the user (including deliverable artifacts and images referenced in your answer with the `![]()` Markdown syntax) should not reside in tmpfs locations, unless told otherwise. The persistent `./shared_temp` is generally acceptable if the file does not properly belong in any project folder.
