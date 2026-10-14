// Build an official calculate-price item from a verified query-meal-detail response.
// Explicit choices are keyed by round ID; all other rounds retain their defaults.
export function buildCombo(detail, selections = {}, quantity = 1) {
  if (!detail?.code || !Array.isArray(detail.rounds) || !Number.isInteger(quantity) || quantity < 1) throw Error('Invalid meal detail or quantity');
  const known = new Set(detail.rounds.map(r => String(r.id)));
  if (Object.keys(selections).some(key => !known.has(key))) throw Error('Unknown round');
  return { productCode: detail.code, quantity, roundList: detail.rounds.map(round => {
    const explicit = selections[String(round.id)];
    const choices = explicit === undefined ? round.choices.filter(c => c.isDefault === 1).map(c => ({code:c.code,quantity:c.quantity})) : explicit;
    if (!Array.isArray(choices) || new Set(choices.map(c=>c.code)).size !== choices.length) throw Error('Invalid or duplicate choices');
    let count=0;
    const comboItemList=choices.map(pick=>{
      const choice=round.choices.find(c=>c.code===pick.code);
      if(!choice || !Number.isInteger(pick.quantity) || pick.quantity<1 || (choice.maxQuantity>=0 && pick.quantity>choice.maxQuantity)) throw Error('Invalid choice or quantity');
      count+=pick.quantity;
      const values=(choice.modification?.items||[]).flatMap(group=>group.values.flatMap(v=>v.selectedQuantity>0?[{code:v.code,key:v.selectedKey,quantity:v.selectedQuantity}]:v.unselectedKey?[{code:v.code,key:v.unselectedKey,quantity:1}]:[]));
      if(values.some(v=>!v.key)) throw Error('Missing modification key');
      return {code:choice.code,quantity:pick.quantity,...(values.length?{modification:{values}}:{})};
    });
    if(count<round.minQuantity || (round.maxQuantity>=0 && count>round.maxQuantity)) throw Error('Round serving constraints violated');
    return {round:String(round.id),comboItemList};
  })};
}
