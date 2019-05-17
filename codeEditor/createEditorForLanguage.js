const
	{ editor: { create: createMonacoEditor } } = require("monaco-editor"),
	{ createElement } = require("react");

module.exports =
	language => {
		/** @type {import("monaco-editor").editor.IStandaloneCodeEditor} */
		let monacoEditor = null;

		/** @type {{dispose, setStateFromValue}} */
		let onDidChangeModelContent = null;

		return { createEditorElement };

		function createEditorElement({
			setStateFromValue,
			value,
		}) {
			return (
				createElement(
					"div",
					{
						ref: setDomContainerElement,
						// Mitigates automaticLayout property set to true not resizing the height back down to being smaller
						style: { overflow: "hidden" },
					},
				)
			);

			function setDomContainerElement(
				domElement,
			) {
				if (domElement !== null)
					if (isNewEditorRequired())
						initializeMonacoEditor();
					else
						updateMonacoEditor();

				function isNewEditorRequired() {
					return (
						!monacoEditor
						||
						disposeWhenDomElementHasChanged({
							disposables:
								[ monacoEditor, onDidChangeModelContent ],
							domElement,
							editor:
								monacoEditor,
						})
					);
				}

				function initializeMonacoEditor() {
					monacoEditor =
						createMonacoEditor(
							domElement,
							{
								automaticLayout: true,
								language,
								minimap: { enabled: false },
								scrollBeyondLastLine: false,
								value,
							},
						);

					initializeOnDidChangeModelContent();
				}

				function updateMonacoEditor() {
					updateValue();
					updateOnDidChangeModelContent();

					function updateValue() {
						if (monacoEditor.getValue() !== value)
							monacoEditor.setValue(value);
					}

					function updateOnDidChangeModelContent() {
						if (onDidChangeModelContent.setStateFromValue !== setStateFromValue) {
							if (onDidChangeModelContent)
								onDidChangeModelContent.dispose();

							initializeOnDidChangeModelContent();
						}
					}
				}

				function initializeOnDidChangeModelContent() {
					onDidChangeModelContent =
						{
							dispose:
								monacoEditor.onDidChangeModelContent(
									() =>
										setStateFromValue(
											monacoEditor.getValue(),
										),
								)
								.dispose,
							setStateFromValue,
						};
				}
			}
		}
	};

function disposeWhenDomElementHasChanged({
	domElement,
	editor,
	disposables,
}) {
	if (editor.getDomNode().parentElement === domElement)
		return false;
	else {
		for (const { dispose } of disposables)
			dispose();

		return true;
	}
}