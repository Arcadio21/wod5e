/* global game, WOD5E, Dialog, renderTemplate, ChatMessage */

export const _onCreateItem = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const itemsList = WOD5E.ItemTypes.getList({})
  const type = target.getAttribute('data-type')

  // Variables to be defined later
  let subtype = target.getAttribute('data-subtype')
  let itemName = ''
  let selectLabel = ''
  let itemOptions = {}
  let itemData = {}
  let options = ''

  // Define the actor's gamesystem, defaulting to "mortal" if it's not in the systems list
  const system = actor.system.gamesystem in WOD5E.Systems.getList({}) ? actor.system.gamesystem : 'mortal'

  // Generate the item name
  itemName = subtype ? WOD5E.api.generateLabelAndLocalize({ string: subtype, type }) : itemsList[type].label

  // Generate item-specific data based on type
  switch (type) {
    case 'power':
      selectLabel = game.i18n.localize('WOD5E.VTM.SelectDiscipline')
      itemOptions = WOD5E.Disciplines.getList({})
      itemName = game.i18n.format('WOD5E.VTM.NewStringPower', { string: itemName })
      break
    case 'perk':
      selectLabel = game.i18n.localize('WOD5E.HTR.SelectEdge')
      itemOptions = WOD5E.Edges.getList({})
      itemName = game.i18n.format('WOD5E.HTR.NewStringPerk', { string: itemName })
      break
    case 'gift':
      selectLabel = game.i18n.localize('WOD5E.WTA.SelectGift')
      itemOptions = WOD5E.Gifts.getList({})

      if (subtype && subtype === 'rite') {
        itemName = game.i18n.format('WOD5E.NewString', { string: itemName })
      } else {
        itemName = game.i18n.format('WOD5E.WTA.NewStringGift', { string: itemName })
      }
      break
    case 'edgepool':
      itemName = game.i18n.format('WOD5E.HTR.NewStringEdgePool', { string: itemName })
      break
    case 'feature':
      selectLabel = game.i18n.localize('WOD5E.ItemsList.SelectFeature')
      itemOptions = WOD5E.Features.getList({})
      itemName = game.i18n.format('WOD5E.NewString', { string: itemName })
      break
    default:
      itemName = game.i18n.format('WOD5E.NewString', { string: itemName })
      break
  }

  // Create item if subtype is already defined or not needed
  if (subtype || ['customRoll', 'boon'].includes(type)) {
    if (subtype) {
      itemData = await appendSubtypeData(type, subtype, itemData)
    }

    // Create the item
    await createItem(actor, itemName, type, itemData)
  } else {
    // Build the options for the select dropdown
    for (const [key, value] of Object.entries(itemOptions)) {
      options += `<option value="${key}">${value.displayName}</option>`
    }

    // Template for the dialog form
    const template = `
      <form>
        <div class="form-group">
          <label>${selectLabel}</label>
          <select id="subtypeSelect">${options}</select>
        </div>
      </form>`

    // Define dialog buttons
    const buttons = {
      submit: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('WOD5E.Add'),
        callback: async (html) => {
          subtype = html.find('#subtypeSelect')[0].value
          itemData = await appendSubtypeData(type, subtype, itemData)

          // Create the item
          await createItem(actor, itemName, type, itemData)
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('WOD5E.Cancel')
      }
    }

    // Display the dialog
    new Dialog({
      title: game.i18n.localize('WOD5E.Add'),
      content: template,
      buttons,
      default: 'submit'
    }, {
      classes: ['wod5e', system, 'dialog']
    }).render(true)
  }
}

export const _onItemChat = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  const itemId = target.getAttribute('data-item-id')
  const item = actor.getEmbeddedDocument('Item', itemId)
  renderTemplate('systems/vtm5e/display/ui/chat/chat-message.hbs', {
    name: item.name,
    img: item.img,
    description: item.system.description
  }).then(html => {
    ChatMessage.create({
      content: html
    })
  })
}

export const _onItemEdit = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  const itemId = target.getAttribute('data-item-id')
  const item = actor.getEmbeddedDocument('Item', itemId)
  item.sheet.render(true)
}

export const _onItemDelete = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Primary variables
  const itemId = target.getAttribute('data-item-id')
  const item = actor.getEmbeddedDocument('Item', itemId)

  // Define the actor's gamesystem, defaulting to "mortal" if it's not in the systems list
  const system = actor.system.gamesystem in WOD5E.Systems.getList({}) ? actor.system.gamesystem : 'mortal'

  // Variables yet to be defined
  let buttons = {}

  // Define the template to be used
  const template = `
  <form>
      <div class="form-group">
          <label>${game.i18n.format('WOD5E.ConfirmDeleteDescription', {
            string: item.name
          })}</label>
      </div>
  </form>`

  // Define the buttons and push them to the buttons variable
  buttons = {
    delete: {
      label: game.i18n.localize('WOD5E.Delete'),
      callback: async () => {
        actor.deleteEmbeddedDocuments('Item', [itemId])
      }
    },
    cancel: {
      label: game.i18n.localize('WOD5E.Cancel')
    }
  }

  new Dialog({
    title: game.i18n.localize('WOD5E.ConfirmDelete'),
    content: template,
    buttons,
    default: 'cancel'
  },
  {
    classes: ['wod5e', system, 'dialog']
  }).render(true)
}

// Create an embedded item document
async function createItem (actor, itemName, type, itemData) {
  return actor.createEmbeddedDocuments('Item', [{
    name: itemName,
    type,
    system: itemData
  }])
}

// Append subtype data to the item data based on item type
async function appendSubtypeData (type, subtype, itemData) {
  switch (type) {
    case 'power':
      itemData.discipline = subtype
      break
    case 'perk':
      itemData.edge = subtype
      break
    case 'edgepool':
      itemData.edge = subtype
      break
    case 'gift':
      itemData.giftType = subtype
      break
    case 'feature':
      itemData.featuretype = subtype
      break
    default:
      itemData.subtype = subtype
  }

  return itemData
}