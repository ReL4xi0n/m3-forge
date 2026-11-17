export const Close = ({ onClose }) => <button type="button" className="icon-btn" aria-label="Close" onClick={() => onClose()}><span className="m3-icon">close</span></button>;
export const IconAction = ({ name, ...props }) => <button className="icon-btn" {...props}><span className="m3-icon">{name}</span></button>;
export const Add = () => <button className="text-btn"><span className="m3-icon">add</span>{'New list'}</button>;
export const Back = ({ label }) => <button className="icon-btn" title={label}><span className="m3-icon">arrow_back</span></button>;
export const Item = ({ n }) => <li className="row">{n > 1 ? 'Lists' : 'List'}</li>;
