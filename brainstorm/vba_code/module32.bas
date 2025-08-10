Attribute VB_Name = "Module32"
Sub PasteKeepersESPN()
Attribute PasteKeepersESPN.VB_ProcData.VB_Invoke_Func = " \n14"
'
' PasteKeepersESPN Macro

'paste keeper values from other sheet

On Error GoTo errHandler
    Range("A1").Select
    Selection.PasteSpecial Paste:=xlPasteValues, Operation:=xlNone, SkipBlanks _
        :=False, Transpose:=False
        


 Sheets("Overall").Select
     'unhide columns for pasting
    Columns("AX:AY").Select
    Selection.EntireColumn.Hidden = False
    
    'fill in formula for keepers
 Range("AY12").Formula = "=IF(ISNA(INDEX('ESPN Keeper Import'!$B:$B,MATCH([@KeeperName],'ESPN Keeper Import'!$A:$A,0))),"""",INDEX('ESPN Keeper Import'!$B:$B,MATCH([@KeeperName],'ESPN Keeper Import'!$A:$A,0)))"
   Range("AY12").AutoFill Destination:=Range("AY12:AY605")
    
'clear empty cells
 ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=51, Criteria1:= _
        "="
    Range("Table1[KeeperPick]").Select
    Selection.ClearContents
    
     'copy keeper picks
   ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=51
    
  Range("Table1[KeeperPick]").Copy
  
  'paste keeper picks in proper column
  
  Range("Table1[Pick Num]").Select
    Selection.PasteSpecial Paste:=xlPasteValues, Operation:=xlNone, SkipBlanks _
        :=False, Transpose:=False
  
 Application.CutCopyMode = False
 
  'rehide columns after finished
      Columns("AX:BA").Select
    Selection.EntireColumn.Hidden = True
  'error message when pasting
  
  Exit Sub
errHandler:
MsgBox ("Error: Make sure you've pressed the Export Keepers in the Helper Spreadsheet before trying to import them here"), , "Error"
End Sub
Sub PasteKeepersManual()
'paste keeper values from other sheet

On Error GoTo errHandler
    Range("A1").Select
    Selection.PasteSpecial Paste:=xlPasteValues, Operation:=xlNone, SkipBlanks _
        :=False, Transpose:=False
        

 Sheets("Overall").Select
     'unhide columns for pasting
    Columns("AX:AY").Select
    Selection.EntireColumn.Hidden = False
    
    'fill in formula for keepers
 Range("AY12").Formula = "=IF(ISNA(INDEX('Manual Keeper Import'!$B:$B,MATCH([@Player],'Manual Keeper Import'!$A:$A,0))),"""",INDEX('Manual Keeper Import'!$B:$B,MATCH([@Player],'Manual Keeper Import'!$A:$A,0)))"
   Range("AY12").AutoFill Destination:=Range("AY12:AY605")
    
'clear empty cells
 ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=51, Criteria1:= _
        "="
    Range("Table1[KeeperPick]").Select
    Selection.ClearContents
    
     'copy keeper picks
   ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=51
    
  Range("Table1[KeeperPick]").Copy
  
  'paste keeper picks in proper column
  
  Range("Table1[Pick Num]").Select
    Selection.PasteSpecial Paste:=xlPasteValues, Operation:=xlNone, SkipBlanks _
        :=False, Transpose:=False
  
 Application.CutCopyMode = False
 
  'rehide columns after finished
      Columns("AX:BA").Select
    Selection.EntireColumn.Hidden = True
  'error message when pasting
  
  Exit Sub
errHandler:
MsgBox ("Error: Make sure you've pressed the Export Keepers in the Helper Spreadsheet before trying to import them here"), , "Error"
End Sub
