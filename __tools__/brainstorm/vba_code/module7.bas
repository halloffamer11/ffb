Attribute VB_Name = "Module7"
Sub autofilterupdate()
Attribute autofilterupdate.VB_ProcData.VB_Invoke_Func = " \n14"
'
' autofilterupdate Macro
'

'
    Range("Table1").Select
    Range("Table1[#All]").AdvancedFilter Action:=xlFilterInPlace, CriteriaRange _
        :=Range("AX2:AX3"), Unique:=True
    
    ActiveSheet.ShowAllData
End Sub
Sub autofilterauto()
Attribute autofilterauto.VB_ProcData.VB_Invoke_Func = " \n14"

    Range("Table1[#All]").AdvancedFilter Action:=xlFilterInPlace, CriteriaRange _
        :=Range("AX2:AX3"), Unique:=True
End Sub
Sub autoclear()
Attribute autoclear.VB_ProcData.VB_Invoke_Func = " \n14"
'
' autoclear Macro
'

'
    ActiveSheet.ShowAllData
    Range("Table1").Select
    Range("Table1[#All]").AdvancedFilter Action:=xlFilterInPlace, CriteriaRange _
        :=Range("AX2:AX3"), Unique:=True
    ActiveWindow.SmallScroll Down:=-15
End Sub
Sub center_shapes_in_cells()
Dim Row As Integer
Dim Shp As Shape
Dim myShapes As Object
Set myShapes = Selection.ShapeRange

For Each Shp In myShapes
    Shp.Select

    Dim vSel As Variant
    Dim rngZ As Range

    Set vSel = Selection
    If VarType(vSel) = vbObject Then
        With vSel
            Set rngZ = .TopLeftCell
            .Height = rngZ.MergeArea.Height - 5
            .Top = rngZ.Top + (rngZ.MergeArea.Height - .Height) / 2
            .Width = rngZ.MergeArea.Width - 5
            .Left = rngZ.Left + (rngZ.MergeArea.Width - .Width) / 2
            .ShapeRange.LockAspectRatio = msoFalse
            .Placement = xlMoveAndSize
            .PrintObject = True
        End With
        rngZ.Select
    End If
Next
End Sub
