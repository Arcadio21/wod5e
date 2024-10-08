/* global game */

import { WOD5eDice } from '../../../scripts/system-rolls.js'

/** Handle rolling for a frenzy check */
export const _onFrenzyRoll = async function (event) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Secondary variables
  const willpowerDicePool = getWillpowerDicePool(actor)
  const humanity = actor.system.humanity.value
  const dicePool = Math.max(willpowerDicePool + Math.floor(humanity / 3), 1)

  WOD5eDice.Roll({
    basicDice: dicePool,
    title: game.i18n.localize('WOD5E.VTM.ResistingFrenzy'),
    actor,
    data: actor.system,
    disableAdvancedDice: true,
    callback: async (err, result) => {
      if (err) console.log(err)

      if (!result.rollSuccessful) {
        await actor.update({ 'system.frenzyActive': true })
      }
    }
  })
}

// Calculate the dice for a Willpower roll
function getWillpowerDicePool (actor) {
  const willpowerMax = actor.system.willpower.max
  const willpowerAgg = actor.system.willpower.aggravated
  const willpowerSup = actor.system.willpower.superficial

  return Math.max((willpowerMax - willpowerAgg - willpowerSup), 0)
}
