Attribute VB_Name = "Module19"
Sub ShowEntry_Click()
If Range("adpppr").EntireColumn.Hidden = False Then
UserForm2.InflPrice.Value = True
End If
If Range("nflprice").EntireColumn.Hidden = False Then
UserForm2.NFLprice.Value = True
End If
If Range("dynADP").EntireColumn.Hidden = False Then
UserForm2.overallavg.Value = True
End If
If Range("projprice").EntireColumn.Hidden = False Then
UserForm2.ProjPrice.Value = True
End If
If Range("adpppr").EntireColumn.Hidden = False Then
UserForm2.InflPrice.Value = True
End If

If Range("vbd").EntireColumn.Hidden = False Then
UserForm2.vbd.Value = True
End If
If Range("vbdval").EntireColumn.Hidden = False Then
UserForm2.vbdval.Value = True
End If
If Range("GoldRank").EntireColumn.Hidden = False Then
UserForm2.GoldRank.Value = True
End If
If Range("vbdtier").EntireColumn.Hidden = False Then
UserForm2.vbdtier.Value = True
End If
If Range("RankCustom").EntireColumn.Hidden = False Then
UserForm2.CustomRank.Value = True
End If
If Range("trSTD").EntireColumn.Hidden = False Then
UserForm2.TierStd.Value = True
End If
If Range("trPPR").EntireColumn.Hidden = False Then
UserForm2.TierPPR.Value = True
End If
If Range("tr5PPR").EntireColumn.Hidden = False Then
UserForm2.Tier5PPR.Value = True
End If
If Range("RankDiff").EntireColumn.Hidden = False Then
UserForm2.RankDiff.Value = True
End If

If Range("RankYahoo").EntireColumn.Hidden = False Then
UserForm2.YahooRnk.Value = True
End If
If Range("ADPyahoo").EntireColumn.Hidden = False Then
UserForm2.YahooADP.Value = True
End If

If Range("PointProj").EntireColumn.Hidden = False Then
UserForm2.PrjPnts.Value = True
End If
If Range("RankPPR").EntireColumn.Hidden = False Then
UserForm2.PPRrnk.Value = True
End If

If Range("RankNFL").EntireColumn.Hidden = False Then
UserForm2.NFLrnk.Value = True
End If

If Range("ADPnfl").EntireColumn.Hidden = False Then
UserForm2.NFLadp.Value = True
End If
If Range("RankESPN").EntireColumn.Hidden = False Then
UserForm2.ESPNrnk.Value = True
End If

If Range("ADPespn").EntireColumn.Hidden = False Then
UserForm2.ESPNadp.Value = True
End If
If Range("RankECR").EntireColumn.Hidden = False Then
UserForm2.ECRrnk.Value = True
End If
If Range("ADPecr").EntireColumn.Hidden = False Then
UserForm2.ECRadp.Value = True
End If
If Range("Skew").EntireColumn.Hidden = False Then
UserForm2.RnkSkew.Value = True
End If
If Range("BeerV").EntireColumn.Hidden = False Then
UserForm2.BrValue.Value = True
End If

If Range("BeerScarcity").EntireColumn.Hidden = False Then
UserForm2.PosScarc.Value = True
End If
If Range("Rank5PPR").EntireColumn.Hidden = False Then
UserForm2.FP5PPR.Value = True
End If
If Range("rookies").EntireColumn.Hidden = False Then
UserForm2.FProok.Value = True
End If
If Range("dynasty").EntireColumn.Hidden = False Then
UserForm2.FPdynasty.Value = True
End If

If Range("FFCADP").EntireColumn.Hidden = False Then
UserForm2.NFLavg.Value = True
End If
If Range("ESP").EntireColumn.Hidden = False Then
UserForm2.ESP.Value = True
End If

UserForm2.Show

End Sub
