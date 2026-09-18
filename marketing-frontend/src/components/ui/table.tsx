import type { ComponentProps } from 'react'
export function Table(props:ComponentProps<'table'>){return <table className="studio-table" {...props}/>}
export function TableHeader(props:ComponentProps<'thead'>){return <thead {...props}/>}
export function TableBody(props:ComponentProps<'tbody'>){return <tbody {...props}/>}
export function TableRow(props:ComponentProps<'tr'>){return <tr {...props}/>}
export function TableHead(props:ComponentProps<'th'>){return <th {...props}/>}
export function TableCell(props:ComponentProps<'td'>){return <td {...props}/>}
