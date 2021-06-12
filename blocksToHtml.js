const isHTML = RegExp.prototype.test.bind(/(<([^>]+)>)/i)

const convertBlockIntoHtml = (block, keepHtml = false) => {
	if (block.type === 'child_page')
		return
	if (block.type === 'unsupported')
		return
	if (block.type === 'toggle')
		return
	if (block[block.type].text.length === 0)
		return

	const content = block[block.type].text[0].plain_text
	var html = new Array

	switch (block.type) {
		case 'paragraph':
			if (!keepHtml && !isHTML(content))
				html = ['<p>', '</p>']
			break
		case 'to_do':
			html = ['<p>', '</p>']
			break
		case 'heading_1':
			html = ['<h1>', '</h1>']
			break
		case 'heading_2':
			html = ['<h2>', '</h2>']
			break
		case 'heading_3':
			html = ['<h3>', '</h3>']
			break
		case 'bulleted_list_item':
			html = ['<ul><li>', '</li></ul>']
			break
		case 'numbered_list_item':
			html = ['<ol><li>', '</li></ol>']
			break
	}

	html.splice(1, 0, content)
	return html.join('')
}

/**
 * annotations: bold, code, color, italic, strikethrough, underline
 * href
 * other types
 */

const convertToHTML = (blocks) => {
	var page = blocks.flatMap(block => {
		const element = convertBlockIntoHtml(block)

		if (element !== undefined) {
			return element
		} else {
			return []
		}
	})

	// Clean up bullet pointed and numbered lists
	page.forEach((element, index) => {
		// Bullet points
		if (element.includes('<ul>')) {
			if (index !== 0 && !page[index - 1].includes('</ol>') && page[index - 1].includes('<li>')) {
				page[index] = page[index].slice(4)
			}
			if (index !== page.length - 1 && page[index + 1].includes('<ul>')) {
				page[index] = page[index].slice(0, page[index].length - 5)
			}
		}

		// Numbered list
		if (element.includes('<ol>')) {
			if (index !== 0 && !page[index - 1].includes('</ul>') && page[index - 1].includes('<li>')) {
				page[index] = page[index].slice(4)
			}
			if (index !== page.length - 1 && page[index + 1].includes('<ol>')) {
				page[index] = page[index].slice(0, page[index].length - 5)
			}
		}
	})

	return page.join('')
}

module.exports = {
	convertToHTML
}