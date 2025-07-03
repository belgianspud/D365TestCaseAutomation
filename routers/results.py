"""
Test results and reporting routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database import get_db
from models import TestRun, TestCase
from schemas import TestRun as TestRunSchema
from auth import get_current_user

router = APIRouter()

@router.get("/runs", response_model=List[TestRunSchema])
async def list_test_runs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, regex="^(pending|running|passed|failed|error)$"),
    test_case_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List test runs for the current user"""
    query = db.query(TestRun).filter(TestRun.user_id == current_user["user_id"])
    
    # Apply status filter
    if status_filter:
        query = query.filter(TestRun.status == status_filter)
    
    # Apply test case filter
    if test_case_id:
        # Verify user owns the test case
        test_case = db.query(TestCase).filter(
            TestCase.id == test_case_id,
            TestCase.owner_id == current_user["user_id"]
        ).first()
        if not test_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found"
            )
        query = query.filter(TestRun.test_case_id == test_case_id)
    
    test_runs = query.order_by(desc(TestRun.created_at)).offset(skip).limit(limit).all()
    return test_runs

@router.get("/runs/{run_id}", response_model=TestRunSchema)
async def get_test_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific test run"""
    test_run = db.query(TestRun).filter(
        TestRun.id == run_id,
        TestRun.user_id == current_user["user_id"]
    ).first()
    
    if not test_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found"
        )
    
    return test_run

@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard statistics for the current user"""
    # Total test cases
    total_test_cases = db.query(TestCase).filter(
        TestCase.owner_id == current_user["user_id"],
        TestCase.is_active == True
    ).count()
    
    # Total test runs
    total_test_runs = db.query(TestRun).filter(
        TestRun.user_id == current_user["user_id"]
    ).count()
    
    # Test runs by status
    status_counts = db.query(
        TestRun.status,
        func.count(TestRun.id).label('count')
    ).filter(
        TestRun.user_id == current_user["user_id"]
    ).group_by(TestRun.status).all()
    
    status_stats = {status: count for status, count in status_counts}
    
    # Recent test runs
    recent_runs = db.query(TestRun).filter(
        TestRun.user_id == current_user["user_id"]
    ).order_by(desc(TestRun.created_at)).limit(10).all()
    
    # Success rate calculation
    total_completed = status_stats.get('passed', 0) + status_stats.get('failed', 0)
    success_rate = (status_stats.get('passed', 0) / total_completed * 100) if total_completed > 0 else 0
    
    # Average execution time
    avg_execution_time = db.query(
        func.avg(TestRun.execution_time)
    ).filter(
        TestRun.user_id == current_user["user_id"],
        TestRun.execution_time.isnot(None)
    ).scalar() or 0
    
    return {
        "total_test_cases": total_test_cases,
        "total_test_runs": total_test_runs,
        "status_counts": status_stats,
        "success_rate": round(success_rate, 2),
        "average_execution_time": round(avg_execution_time, 2),
        "recent_runs": [
            {
                "id": run.id,
                "test_case_id": run.test_case_id,
                "status": run.status,
                "execution_time": run.execution_time,
                "created_at": run.created_at
            } for run in recent_runs
        ]
    }

@router.get("/trends")
async def get_test_trends(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get test execution trends over time"""
    from datetime import datetime, timedelta
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily test runs
    daily_runs = db.query(
        func.date(TestRun.created_at).label('date'),
        func.count(TestRun.id).label('total_runs'),
        func.sum(func.case([(TestRun.status == 'passed', 1)], else_=0)).label('passed_runs'),
        func.sum(func.case([(TestRun.status == 'failed', 1)], else_=0)).label('failed_runs')
    ).filter(
        TestRun.user_id == current_user["user_id"],
        TestRun.created_at >= start_date
    ).group_by(func.date(TestRun.created_at)).all()
    
    trends = [
        {
            "date": str(date),
            "total_runs": total,
            "passed_runs": passed or 0,
            "failed_runs": failed or 0,
            "success_rate": round((passed or 0) / total * 100, 2) if total > 0 else 0
        }
        for date, total, passed, failed in daily_runs
    ]
    
    return {"trends": trends, "period_days": days}
